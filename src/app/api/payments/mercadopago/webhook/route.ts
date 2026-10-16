import { NextResponse, type NextRequest } from "next/server";
import { MercadoPagoError, processMercadoPagoWebhook } from "@/features/payments/mercadopago";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const body = (await request.json().catch(() => null)) as
    | { type?: string; action?: string; data?: { id?: string | number }; id?: string | number }
    | null;

  const queryDataId = request.nextUrl.searchParams.get("data.id") ?? request.nextUrl.searchParams.get("id");
  const bodyDataId = body?.data?.id !== undefined ? String(body.data.id) : body?.id !== undefined ? String(body.id) : null;
  const dataId = queryDataId ?? bodyDataId;

  if (!dataId) {
    return NextResponse.json({ code: "missing_data_id", message: "Identificador do pagamento ausente." }, { status: 400 });
  }

  try {
    const result = await processMercadoPagoWebhook({
      dataId,
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      webhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET,
      accessToken: env.MERCADOPAGO_ACCESS_TOKEN
    });

    logEvent("info", "mercadopago_webhook_processed", {
      dataId,
      action: result.action,
      created: result.action === "ignored" ? false : result.created
    });

    return NextResponse.json({ ok: true, action: result.action }, { status: 200 });
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      logEvent("warn", "mercadopago_webhook_rejected", { dataId, reasonCode: error.code });
      const status =
        error.code === "invalid_signature"
          ? 401
          : error.code === "not_configured"
            ? 503
            : error.code === "upstream_error"
              ? 502
              : 400;
      return NextResponse.json({ code: error.code, message: error.message }, { status });
    }
    throw error;
  }
}
