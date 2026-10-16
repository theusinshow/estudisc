import type { Product } from "./products";

export type EntitlementStatus = "granted" | "refunded" | "revoked";
export type EntitlementRow = Readonly<{ productId: string; status: string; startsAt: Date; endsAt: Date; createdAt: Date }>;
export type PaymentFacts = Readonly<{ id: string; status: string; amountCents: number; currency: string; externalReference: string | null }>;

/** Access is decided by the latest row for the product; history is append-only. */
export function hasActiveEntitlement(rows: readonly EntitlementRow[], productId: string, now = new Date()) {
  const latest = rows.filter(row => row.productId === productId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return Boolean(latest && latest.status === "granted" && latest.startsAt <= now && now < latest.endsAt);
}

/**
 * Map a payment fetched from the provider (never the webhook body) to the entitlement it implies.
 * Only an approved payment for the exact price and currency of the checkout's product grants access;
 * refunds and chargebacks revoke it. Anything else changes nothing.
 */
export function entitlementForPayment(payment: PaymentFacts, checkout: Readonly<{ id: string; productId: string; amountCents: number; currency: string }>, product: Product): EntitlementStatus | null {
  if (payment.externalReference !== checkout.id || checkout.productId !== product.id) return null;
  if (payment.status === "refunded") return "refunded";
  if (payment.status === "charged_back" || payment.status === "cancelled") return "revoked";
  if (payment.status !== "approved") return null;
  if (payment.amountCents !== product.priceCents || payment.currency !== product.currency || checkout.amountCents !== product.priceCents) return null;
  return "granted";
}
