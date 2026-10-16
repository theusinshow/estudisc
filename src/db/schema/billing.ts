import { integer, pgTable, text, timestamp, uniqueIndex, uuid, index } from "drizzle-orm/pg-core";
import { owners } from "./user-state";

/** ADR 0061: a checkout started by a signed-in owner; the payment references it, never a client-supplied owner. */
export const billingCheckouts = pgTable("billing_checkouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull().references(() => owners.id),
  productId: text("product_id").notNull(),
  provider: text("provider").notNull(),
  providerPreferenceId: text("provider_preference_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, table => [index("billing_checkouts_owner_idx").on(table.ownerId)]);

/** Append-only access history: the latest row per owner and product decides access. */
export const entitlements = pgTable("entitlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull().references(() => owners.id),
  productId: text("product_id").notNull(),
  status: text("status").notNull(),
  source: text("source").notNull(),
  checkoutId: uuid("checkout_id").references(() => billingCheckouts.id),
  providerPaymentId: text("provider_payment_id"),
  amountCents: integer("amount_cents").notNull().default(0),
  currency: text("currency").notNull().default("BRL"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, table => [
  index("entitlements_owner_product_idx").on(table.ownerId, table.productId, table.createdAt),
  uniqueIndex("entitlements_payment_status_idx").on(table.source, table.providerPaymentId, table.status)
]);
