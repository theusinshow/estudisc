import { getOwnerId } from "@/features/auth/owner";
import { NextResponse } from "next/server";

import { ensureDatabaseReady } from "@/db/connection";
import { readJsonRequestWithLimit } from "@/features/import/api";
import { ManualGenerationProvider } from "@/features/generation/infrastructure/manual-generation-provider";
import { getGenerationJobRepository } from "@/features/generation/server-repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const provider = new ManualGenerationProvider();
  const compiled = provider.compile(parsedRequest.body);

  if (!compiled.ok) {
    return NextResponse.json(
      { code: "invalid_generation_spec", message: "A configuração da geração é inválida.", issues: compiled.issues },
      { status: 400 }
    );
  }

  try {
    await ensureDatabaseReady();
    const job = await getGenerationJobRepository().create({
      ownerId: await getOwnerId(),
      mode: "manual_copy_paste",
      provider: "manual",
      spec: compiled.spec,
      compiledPrompt: compiled.compiledPrompt,
      status: "waiting_external_response"
    });

    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
        compiledPrompt: compiled.compiledPrompt,
        importTarget: compiled.spec.importTarget
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL is not configured") {
      return NextResponse.json(
        { code: "database_not_configured", message: "Configure DATABASE_URL para persistir a geração." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { code: "generation_compile_failed", message: "Não foi possível compilar a geração agora." },
      { status: 500 }
    );
  }
}

