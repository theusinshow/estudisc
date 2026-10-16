import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { owners } from "./user-state";

export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => owners.id),
    productId: text("product_id").notNull(),
    status: text("status").notNull(),
    source: text("source").notNull(),
    providerPaymentId: text("provider_payment_id"),
    amountCents: integer("amount_cents").notNull().default(0),
    currency: text("currency").notNull().default("BRL"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("entitlements_owner_product_created_idx").on(table.ownerId, table.productId, table.createdAt),
    uniqueIndex("entitlements_provider_payment_status_idx").on(table.providerPaymentId, table.status),
    check("entitlements_status_check", sql`${table.status} in ('granted', 'refunded', 'revoked')`),
    check("entitlements_amount_non_negative", sql`${table.amountCents} >= 0`)
  ]
);

export const inviteCodes = pgTable(
  "invite_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    label: text("label").notNull(),
    productId: text("product_id").notNull(),
    maxUses: integer("max_uses").notNull().default(1),
    usedCount: integer("used_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("invite_codes_code_idx").on(table.code),
    check("invite_codes_uses_valid", sql`${table.maxUses} > 0 AND ${table.usedCount} >= 0 AND ${table.usedCount} <= ${table.maxUses}`)
  ]
);
