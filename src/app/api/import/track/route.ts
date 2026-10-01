import { NextResponse } from "next/server";

import { ensureDatabaseReady } from "@/db/connection";
import { getDatabaseUrl } from "@/db/connection";
import { MemoryTrackImportRepository } from "@/db/repositories/memory-store";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { importTrackPack, readJsonRequestWithLimit } from "@/features/import/api";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let profile;try{profile=await requireAdmin();}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"admin_required"},{status:403});throw error;}
  const parsedRequest = await readJsonRequestWithLimit(request);

  if (!parsedRequest.ok) {
    return NextResponse.json(
      {
        code: parsedRequest.code,
        message: parsedRequest.message,
        maxBytes: parsedRequest.maxBytes,
        byteLength: parsedRequest.byteLength
      },
      { status: parsedRequest.code === "payload_too_large" ? 413 : 400 }
    );
  }

  try {
    await ensureDatabaseReady();
    const repository =
      getDatabaseUrl() === "memory://local" ? new MemoryTrackImportRepository() : new DrizzleTrackImportRepository(undefined,profile.ownerId);
    const result = await importTrackPack(parsedRequest.body, repository);

    if (result.status === "invalid") {
      return NextResponse.json(
        { code: "invalid_pack", message: "O Pack não passou na validação.", issues: result.issues },
        { status: 400 }
      );
    }

    if (result.status === "conflict") {
      return NextResponse.json(
        {
          code: "pack_conflict",
          message: result.message,
          packId: result.packId,
          version: result.version,
          existingContentHash: result.existingContentHash,
          incomingContentHash: result.incomingContentHash
        },
        { status: 409 }
      );
    }

    return NextResponse.json(result, { status: result.status === "imported" ? 201 : 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL is not configured") {
      return NextResponse.json(
        { code: "database_not_configured", message: "Configure DATABASE_URL para importar conteúdo." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { code: "import_failed", message: "Não foi possível importar o Pack agora." },
      { status: 500 }
    );
  }
}
