import { check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { owners } from "./user-state";

/** ADR 0068: one account per learner, keyed by the existing ownerId so learning state is never rewritten. */
export const userAccounts = pgTable(
  "user_accounts",
  {
    id: text("id").primaryKey().references(() => owners.id),
    email: text("email"),
    name: text("name").notNull(),
    role: text("role").notNull().default("STUDENT"),
    status: text("status").notNull().default("active"),
    termsVersion: text("terms_version"),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    guardianDeclaration: jsonb("guardian_declaration"),
    sessionVersion: integer("session_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("user_accounts_email_idx").on(table.email),
    check("user_accounts_role_check", sql`${table.role} in ('ADMIN', 'STUDENT')`),
    check("user_accounts_status_check", sql`${table.status} in ('active', 'disabled')`),
    check("user_accounts_email_lowercase", sql`${table.email} is null or ${table.email} = lower(${table.email})`)
  ]
);

export const accountIdentities = pgTable(
  "account_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull().references(() => userAccounts.id),
    provider: text("provider").notNull(),
    subject: text("subject").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("account_identities_provider_subject_idx").on(table.provider, table.subject),
    index("account_identities_account_idx").on(table.accountId),
    check("account_identities_provider_check", sql`${table.provider} in ('email', 'google', 'legacy_code')`)
  ]
);

/** Single-use, short-lived sign-in codes; only an HMAC of the code is stored. */
export const emailLoginCodes = pgTable(
  "email_login_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    intent: text("intent").notNull(),
    accountId: text("account_id").references(() => userAccounts.id),
    payload: jsonb("payload").notNull().default({}),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("email_login_codes_email_created_idx").on(table.email, table.createdAt),
    check("email_login_codes_intent_check", sql`${table.intent} in ('signin', 'signup', 'link')`),
    check("email_login_codes_attempts_check", sql`${table.attempts} >= 0`)
  ]
);
