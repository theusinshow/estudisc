import { NextResponse } from "next/server";
import { BillingRepository } from "@/db/repositories/billing-repository";
import { getPayment, MercadoPagoError, verifyWebhookSignature } from "@/features/billing/mercadopago";
import { isPaidAccessEnabled } from "@/features/billing/paid-access";
import { DEFAULT_PRODUCT_ID, findProduct } from "@/features/billing/products";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";

/**
 * Mercado Pago notifications (ADR 0061). The signature is verified, then the payment is read from the
 * provider API; the request body is never trusted for status, amount or owner.
 */
export async function POST(request: Request) {
  const env = getServerEnv();
  if (!isPaidAccessEnabled(env)) return NextResponse.json({ code: "billing_disabled" }, { status: 404 });
  if (!env.MERCADOPAGO_ACCESS_TOKEN || !env.MERCADOPAGO_WEBHOOK_SECRET) return NextResponse.json({ code: "billing_not_configured" }, { status: 503 });
  const url = new URL(request.url);
  const body = await request.json().catch(() => null) as { type?: string; data?: { id?: string | number } } | null;
  const type = url.searchParams.get("type") ?? body?.type;
  const dataId = url.searchParams.get("data.id") ?? (body?.data?.id !== undefined ? String(body.data.id) : null);
  if (!dataId) return NextResponse.json({ code: "ignored" }, { status: 200 });
  if (!verifyWebhookSignature({ signature: request.headers.get("x-signature"), requestId: request.headers.get("x-request-id"), dataId, secret: env.MERCADOPAGO_WEBHOOK_SECRET })) {
    logEvent("warn", "billing_webhook_rejected", { reasonCode: "invalid_signature" });
    return NextResponse.json({ code: "invalid_signature" }, { status: 401 });
  }
  if (type !== "payment") return NextResponse.json({ code: "ignored" }, { status: 200 });
  try {
    const payment = await getPayment({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN, paymentId: dataId });
    const result = await new BillingRepository().applyPayment(payment, findProduct(DEFAULT_PRODUCT_ID)!);
    logEvent("info", "billing_webhook_applied", { reasonCode: result.changed ? `entitlement_${result.status}` : result.reason ?? "unchanged" });
    return NextResponse.json({ code: "ok" }, { status: 200 });
  } catch (error) {
    // A provider failure answers 5xx so Mercado Pago retries the notification.
    if (error instanceof MercadoPagoError) { logEvent("error", "billing_webhook_failed", { reasonCode: "provider_error" }); return NextResponse.json({ code: "retry" }, { status: 502 }); }
    throw error;
  }
}
