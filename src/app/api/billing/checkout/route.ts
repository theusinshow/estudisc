import { NextResponse } from "next/server";
import { AccessDeniedError, getOwnerProfile } from "@/features/auth/owner";
import { BillingRepository } from "@/db/repositories/billing-repository";
import { createPreference, MercadoPagoError } from "@/features/billing/mercadopago";
import { isPaidAccessEnabled } from "@/features/billing/paid-access";
import { DEFAULT_PRODUCT_ID, findProduct } from "@/features/billing/products";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";

/** Starts a hosted Mercado Pago checkout for the signed-in customer (ADR 0061). */
export async function POST() {
  const env = getServerEnv();
  if (!isPaidAccessEnabled(env)) return NextResponse.json({ code: "billing_disabled" }, { status: 404 });
  if (!env.MERCADOPAGO_ACCESS_TOKEN || !env.APP_URL) return NextResponse.json({ code: "billing_not_configured" }, { status: 503 });
  let ownerId: string;
  try { ownerId = (await getOwnerProfile()).ownerId; } catch (error) { if (error instanceof AccessDeniedError) return NextResponse.json({ code: "auth_required" }, { status: 401 }); throw error; }
  const product = findProduct(DEFAULT_PRODUCT_ID)!;
  const repo = new BillingRepository();
  if (await repo.hasAccess(ownerId, product.id)) return NextResponse.json({ code: "already_active" }, { status: 409 });
  const checkout = await repo.createCheckout(ownerId, product);
  try {
    const preference = await createPreference({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN, product, checkoutId: checkout.id, appUrl: env.APP_URL.replace(/\/$/, "") });
    await repo.attachPreference(checkout.id, preference.preferenceId);
    logEvent("info", "billing_checkout_created", { productId: product.id });
    return NextResponse.json({ checkoutUrl: preference.checkoutUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof MercadoPagoError) { logEvent("error", "billing_checkout_failed", { reasonCode: "provider_error" }); return NextResponse.json({ code: "provider_unavailable" }, { status: 502 }); }
    throw error;
  }
}
