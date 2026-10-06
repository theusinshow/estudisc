import { NextResponse } from "next/server";

import { ensureDatabaseReady, getDatabaseUrl } from "@/db/connection";
import { MemoryTrackImportRepository } from "@/db/repositories/memory-store";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { previewTrackPack, readJsonRequestWithLimit, MAX_TRACK_PACK_BYTES } from "@/features/import/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsedRequest = await readJsonRequestWithLimit(request, MAX_TRACK_PACK_BYTES);

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
      getDatabaseUrl() === "memory://local" ? new MemoryTrackImportRepository() : new DrizzleTrackImportRepository();
    const result = await previewTrackPack(parsedRequest.body, repository);

    if (result.status === "invalid") {
      return NextResponse.json(
        { code: "invalid_pack", message: "O Pack não passou na validação.", issues: result.issues },
        { status: 400 }
      );
    }

    if (result.status === "conflict") {
      return NextResponse.json({ code: "pack_conflict", ...result }, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL is not configured") {
      return NextResponse.json(
        { code: "database_not_configured", message: "Configure DATABASE_URL para pré-visualizar importação." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { code: "import_preview_failed", message: "Não foi possível pré-visualizar o Pack agora." },
      { status: 500 }
    );
  }
}
