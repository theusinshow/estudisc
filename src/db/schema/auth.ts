import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Email one-time codes (ADR 0068). Only keyed hashes are stored: never the email address or the code.
export const emailLoginCodes = pgTable(
  "email_login_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    emailHash: text("email_hash").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("email_login_codes_email_created_idx").on(table.emailHash, table.createdAt)]
);

// Sign-in rate limit events shared by every server instance; old rows are pruned by age.
export const authRateEvents = pgTable(
  "auth_rate_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("auth_rate_events_kind_key_created_idx").on(table.kind, table.key, table.createdAt)]
);
