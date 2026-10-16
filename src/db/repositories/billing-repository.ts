import { and, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import type * as schema from "@/db/schema";
import { billingCheckouts, entitlements, owners } from "@/db/schema";
import { getDatabase } from "@/db/connection";
import { entitlementForPayment, hasActiveEntitlement, type PaymentFacts } from "@/features/billing/entitlement-policy";
import type { Product } from "@/features/billing/products";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export class BillingRepository {
  constructor(private readonly db: Database = getDatabase()) {}

  async createCheckout(ownerId: string, product: Product, provider = "mercadopago") {
    await this.db.insert(owners).values({ id: ownerId, displayName: "Estudisc customer" }).onConflictDoNothing();
    const [row] = await this.db.insert(billingCheckouts).values({ ownerId, productId: product.id, provider, amountCents: product.priceCents, currency: product.currency }).returning();
    return row;
  }

  async attachPreference(checkoutId: string, preferenceId: string) {
    await this.db.update(billingCheckouts).set({ providerPreferenceId: preferenceId }).where(eq(billingCheckouts.id, checkoutId));
  }

  async hasAccess(ownerId: string, productId: string, now = new Date()) {
    const rows = await this.db.select().from(entitlements).where(and(eq(entitlements.ownerId, ownerId), eq(entitlements.productId, productId)));
    return hasActiveEntitlement(rows, productId, now);
  }

  /** Idempotent: the same payment and status never appends twice; unknown or mismatched payments change nothing. */
  async applyPayment(payment: PaymentFacts, product: Product, now = new Date()) {
    const checkoutId = z.uuid().safeParse(payment.externalReference);
    if (!checkoutId.success) return { changed: false as const, reason: "unknown_reference" };
    const [checkout] = await this.db.select().from(billingCheckouts).where(eq(billingCheckouts.id, checkoutId.data));
    if (!checkout) return { changed: false as const, reason: "unknown_checkout" };
    const status = entitlementForPayment(payment, checkout, product);
    if (!status) return { changed: false as const, reason: "no_entitlement_change" };
    const inserted = await this.db.insert(entitlements).values({
      ownerId: checkout.ownerId, productId: product.id, status, source: "mercadopago", checkoutId: checkout.id, providerPaymentId: payment.id,
      amountCents: payment.amountCents, currency: payment.currency, startsAt: now, endsAt: new Date(product.accessEndsAt)
    }).onConflictDoNothing().returning({ id: entitlements.id });
    return { changed: inserted.length > 0, status, ownerId: checkout.ownerId };
  }
}
