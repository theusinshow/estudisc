import { NextResponse, type NextRequest } from "next/server";
import { MercadoPagoError, processMercadoPagoWebhook } from "@/features/payments/mercadopago";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const body = (await request.json().catch(() => null)) as
    | { type?: string; action?: string; data?: { id?: string | number }; id?: string | number }
    | null;

  // Only payment notifications carry a payment id; merchant_order and other topics would fail the payment lookup and be retried forever.
  const topic = body?.type ?? request.nextUrl.searchParams.get("type") ?? request.nextUrl.searchParams.get("topic");
  if (topic && topic !== "payment") {
    return NextResponse.json({ ok: true, action: "ignored" }, { status: 200 });
  }
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
      providerPaymentId: dataId,
      action: result.action,
      created: result.action === "ignored" ? false : result.created
    });

    return NextResponse.json({ ok: true, action: result.action }, { status: 200 });
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      logEvent("warn", "mercadopago_webhook_rejected", { providerPaymentId: dataId, reasonCode: error.code });
      // A payment that will never match (wrong amount/currency or a foreign reference) is acknowledged so
      // Mercado Pago stops retrying; the warning above is the alert for manual reconciliation.
      if (error.code === "amount_mismatch" || error.code === "invalid_reference") {
        return NextResponse.json({ ok: true, action: "ignored", reasonCode: error.code }, { status: 200 });
      }
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
