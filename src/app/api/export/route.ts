import { NextResponse } from "next/server";

import { getExportPayload } from "@/features/export/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const payload = await getExportPayload({
      kind: url.searchParams.get("type"),
      selectedLessonStableId: url.searchParams.get("lessonId")
    });

    return NextResponse.json(payload, {
      headers: {
        "content-disposition": `attachment; filename="estudisc-${payload.kind}.json"`
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL is not configured") {
      return NextResponse.json(
        { code: "database_not_configured", message: "Configure DATABASE_URL para exportar dados." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { code: "export_failed", message: "Não foi possível gerar o export agora." },
      { status: 500 }
    );
  }
}
