import { getOwnerId } from "@/features/auth/owner";
import { z } from "zod";
import { NextResponse } from "next/server";

import { ensureDatabaseReady, getDatabaseUrl } from "@/db/connection";
import { MemoryTrackImportRepository } from "@/db/repositories/memory-store";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { getGenerationJobRepository } from "@/features/generation/server-repositories";
import { buildTrackPackFromGeneratedLesson } from "@/features/generation/manual-generation-service";
import { generationImportTargetSchema } from "@/features/generation/contracts";
import { importTrackPack, readJsonRequestWithLimit } from "@/features/import/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  jobId: z.string().trim().min(1).optional(),
  rawJson: z.string(),
  importTarget: generationImportTargetSchema
});

export async function POST(request: Request) {
  const parsedRequest = await readJsonRequestWithLimit(request);

  if (!parsedRequest.ok) {
    return NextResponse.json(
      { code: parsedRequest.code, message: parsedRequest.message },
      { status: parsedRequest.code === "payload_too_large" ? 413 : 400 }
    );
  }

  const requestBody = requestSchema.safeParse(parsedRequest.body);

  if (!requestBody.success) {
    return NextResponse.json(
      {
        code: "invalid_generated_lesson_import_request",
        message: "A importação precisa receber JSON gerado e destino de importação.",
        issues: requestBody.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      },
      { status: 400 }
    );
  }

  const built = buildTrackPackFromGeneratedLesson(requestBody.data.rawJson, requestBody.data.importTarget);

  if (!built.ok) {
    return NextResponse.json(
      { code: "invalid_generated_lesson", message: "O JSON gerado não passou na validação.", issues: built.issues },
      { status: 400 }
    );
  }

  try {
    await ensureDatabaseReady();
    const repository =
      getDatabaseUrl() === "memory://local" ? new MemoryTrackImportRepository() : new DrizzleTrackImportRepository();
    const result = await importTrackPack(built.trackPack, repository);

    if (requestBody.data.jobId) {
      await getGenerationJobRepository().updateStatus(
        await getOwnerId(),
        requestBody.data.jobId,
        result.status === "imported" || result.status === "already_imported" ? "imported" : "invalid"
      );
    }

    if (result.status === "invalid") {
      return NextResponse.json(
        { code: "invalid_pack", message: "O Pack reconstruído não passou na validação.", issues: result.issues },
        { status: 400 }
      );
    }

    if (result.status === "conflict") {
      return NextResponse.json({ code: "pack_conflict", ...result }, { status: 409 });
    }

    return NextResponse.json(result, { status: result.status === "imported" ? 201 : 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL is not configured") {
      return NextResponse.json(
        { code: "database_not_configured", message: "Configure DATABASE_URL para importar a lição gerada." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { code: "generated_lesson_import_failed", message: "Não foi possível importar a lição gerada agora." },
      { status: 500 }
    );
  }
}

