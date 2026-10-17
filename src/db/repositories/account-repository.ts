import { and, desc, eq, gt, isNull } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";
import { accountIdentities, emailLoginCodes, owners, userAccounts } from "@/db/schema";

export type AccountRole = "ADMIN" | "STUDENT";
export type IdentityProvider = "email" | "google" | "legacy_code";
export type CodeIntent = "signin" | "signup" | "link";
export type GuardianDeclaration = Readonly<{ minor: boolean; declaredAt: string }>;

export type AccountRecord = Readonly<{
  id: string; email: string | null; name: string; role: AccountRole; status: "active" | "disabled";
  sessionVersion: number; termsVersion: string | null; guardianDeclaration: GuardianDeclaration | null;
}>;

export type EmailCodeRecord = Readonly<{
  id: string; email: string; codeHash: string; intent: CodeIntent; accountId: string | null;
  payload: Record<string, unknown>; attempts: number; expiresAt: Date; consumedAt: Date | null; createdAt: Date;
}>;

export type NewAccount = Readonly<{
  id: string; email: string; name: string; role: AccountRole;
  termsVersion: string; termsAcceptedAt: Date; guardianDeclaration: GuardianDeclaration | null;
}>;

/** Persistence for ADR 0068 accounts. Business rules live in features/auth/account-service. */
export interface AccountStore {
  findById(id: string): Promise<AccountRecord | null>;
  findByIdentity(provider: IdentityProvider, subject: string): Promise<AccountRecord | null>;
  /** Same id, name and role as the configured code profile; never touches learning state. */
  upsertLegacyAccount(input: Readonly<{ id: string; name: string; role: AccountRole }>, now: Date): Promise<AccountRecord>;
  /** Creates the account and its e-mail identity; returns null when the e-mail is already taken. */
  createAccount(input: NewAccount): Promise<AccountRecord | null>;
  /** Adds an e-mail identity to an existing account; false when the e-mail belongs to another account. */
  linkEmail(accountId: string, email: string): Promise<boolean>;
  /** The ADR 0061 Google account, created on first sign-in with the same id as before. */
  ensureGoogleAccount(input: Readonly<{ id: string; email: string; name: string; role: AccountRole }>): Promise<AccountRecord>;
  touchSignIn(id: string, now: Date): Promise<void>;
  createEmailCode(input: Omit<EmailCodeRecord, "id" | "attempts" | "consumedAt">): Promise<void>;
  countCodesSince(email: string, since: Date): Promise<number>;
  /** The newest unconsumed, unexpired code for this e-mail. */
  latestOpenCode(email: string, now: Date): Promise<EmailCodeRecord | null>;
  recordCodeAttempt(id: string): Promise<void>;
  consumeCode(id: string, now: Date): Promise<boolean>;
}

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
type AccountRow = typeof userAccounts.$inferSelect;
const toRecord = (row: AccountRow): AccountRecord => ({
  id: row.id, email: row.email, name: row.name, role: row.role as AccountRole, status: row.status as AccountRecord["status"],
  sessionVersion: row.sessionVersion, termsVersion: row.termsVersion, guardianDeclaration: (row.guardianDeclaration as GuardianDeclaration | null) ?? null
});

export class DrizzleAccountRepository implements AccountStore {
  constructor(private readonly db: Database) {}

  async findById(id: string) {
    const [row] = await this.db.select().from(userAccounts).where(eq(userAccounts.id, id));
    return row ? toRecord(row) : null;
  }

  async findByIdentity(provider: IdentityProvider, subject: string) {
    const [row] = await this.db.select({ account: userAccounts }).from(accountIdentities)
      .innerJoin(userAccounts, eq(userAccounts.id, accountIdentities.accountId))
      .where(and(eq(accountIdentities.provider, provider), eq(accountIdentities.subject, subject)));
    return row ? toRecord(row.account) : null;
  }

  async upsertLegacyAccount(input: Readonly<{ id: string; name: string; role: AccountRole }>, now: Date) {
    return this.db.transaction(async (tx) => {
      await tx.insert(owners).values({ id: input.id, displayName: input.name }).onConflictDoNothing();
      await tx.insert(userAccounts).values({ id: input.id, name: input.name, role: input.role, lastSignInAt: now })
        .onConflictDoUpdate({ target: userAccounts.id, set: { name: input.name, role: input.role, lastSignInAt: now } });
      await tx.insert(accountIdentities).values({ accountId: input.id, provider: "legacy_code", subject: input.id }).onConflictDoNothing();
      const [row] = await tx.select().from(userAccounts).where(eq(userAccounts.id, input.id));
      return toRecord(row);
    });
  }

  async createAccount(input: NewAccount) {
    return this.db.transaction(async (tx) => {
      const [taken] = await tx.select({ id: accountIdentities.id }).from(accountIdentities).where(and(eq(accountIdentities.provider, "email"), eq(accountIdentities.subject, input.email)));
      if (taken) return null;
      await tx.insert(owners).values({ id: input.id, displayName: input.name }).onConflictDoNothing();
      const [row] = await tx.insert(userAccounts).values({ id: input.id, email: input.email, name: input.name, role: input.role, termsVersion: input.termsVersion, termsAcceptedAt: input.termsAcceptedAt, guardianDeclaration: input.guardianDeclaration }).returning();
      await tx.insert(accountIdentities).values({ accountId: input.id, provider: "email", subject: input.email });
      return toRecord(row);
    });
  }

  async linkEmail(accountId: string, email: string) {
    return this.db.transaction(async (tx) => {
      const [existing] = await tx.select().from(accountIdentities).where(and(eq(accountIdentities.provider, "email"), eq(accountIdentities.subject, email)));
      if (existing) return existing.accountId === accountId;
      const [owner] = await tx.select({ email: userAccounts.email }).from(userAccounts).where(eq(userAccounts.email, email));
      if (owner) return false;
      await tx.insert(accountIdentities).values({ accountId, provider: "email", subject: email });
      await tx.update(userAccounts).set({ email }).where(and(eq(userAccounts.id, accountId), isNull(userAccounts.email)));
      return true;
    });
  }

  async ensureGoogleAccount(input: Readonly<{ id: string; email: string; name: string; role: AccountRole }>) {
    return this.db.transaction(async (tx) => {
      await tx.insert(owners).values({ id: input.id, displayName: input.name }).onConflictDoNothing();
      const [emailOwner] = await tx.select({ id: userAccounts.id }).from(userAccounts).where(eq(userAccounts.email, input.email));
      await tx.insert(userAccounts).values({ id: input.id, email: emailOwner ? null : input.email, name: input.name, role: input.role }).onConflictDoNothing();
      await tx.insert(accountIdentities).values({ accountId: input.id, provider: "google", subject: input.email }).onConflictDoNothing();
      const [row] = await tx.select().from(userAccounts).where(eq(userAccounts.id, input.id));
      return toRecord(row);
    });
  }

  async touchSignIn(id: string, now: Date) {
    await this.db.update(userAccounts).set({ lastSignInAt: now }).where(eq(userAccounts.id, id));
  }

  async createEmailCode(input: Omit<EmailCodeRecord, "id" | "attempts" | "consumedAt">) {
    await this.db.insert(emailLoginCodes).values({ ...input, payload: input.payload });
  }

  async countCodesSince(email: string, since: Date) {
    const rows = await this.db.select({ id: emailLoginCodes.id }).from(emailLoginCodes).where(and(eq(emailLoginCodes.email, email), gt(emailLoginCodes.createdAt, since)));
    return rows.length;
  }

  async latestOpenCode(email: string, now: Date) {
    const [row] = await this.db.select().from(emailLoginCodes)
      .where(and(eq(emailLoginCodes.email, email), isNull(emailLoginCodes.consumedAt), gt(emailLoginCodes.expiresAt, now)))
      .orderBy(desc(emailLoginCodes.createdAt)).limit(1);
    return row ? { ...row, intent: row.intent as CodeIntent, payload: row.payload as Record<string, unknown> } : null;
  }

  async recordCodeAttempt(id: string) {
    const [row] = await this.db.select({ attempts: emailLoginCodes.attempts }).from(emailLoginCodes).where(eq(emailLoginCodes.id, id));
    if (row) await this.db.update(emailLoginCodes).set({ attempts: row.attempts + 1 }).where(eq(emailLoginCodes.id, id));
  }

  async consumeCode(id: string, now: Date) {
    const rows = await this.db.update(emailLoginCodes).set({ consumedAt: now }).where(and(eq(emailLoginCodes.id, id), isNull(emailLoginCodes.consumedAt))).returning({ id: emailLoginCodes.id });
    return rows.length === 1;
  }
}

type MemoryAccounts = { accounts: Map<string, AccountRecord & { lastSignInAt: Date | null }>; identities: { accountId: string; provider: IdentityProvider; subject: string }[]; codes: EmailCodeRecord[] };
const memoryKey = Symbol.for("estudisc.memory-accounts");
export function memoryAccountState(): MemoryAccounts {
  const holder = globalThis as unknown as Record<symbol, MemoryAccounts | undefined>;
  return (holder[memoryKey] ??= { accounts: new Map(), identities: [], codes: [] });
}

/** Process-local twin for the `memory://local` harness and unit tests. */
export class MemoryAccountRepository implements AccountStore {
  constructor(private readonly state: MemoryAccounts = memoryAccountState()) {}

  async findById(id: string) { return this.state.accounts.get(id) ?? null; }

  async findByIdentity(provider: IdentityProvider, subject: string) {
    const identity = this.state.identities.find(entry => entry.provider === provider && entry.subject === subject);
    return identity ? this.state.accounts.get(identity.accountId) ?? null : null;
  }

  async upsertLegacyAccount(input: Readonly<{ id: string; name: string; role: AccountRole }>, now: Date) {
    const current = this.state.accounts.get(input.id);
    const next = { ...(current ?? { id: input.id, email: null, status: "active" as const, sessionVersion: 1, termsVersion: null, guardianDeclaration: null }), name: input.name, role: input.role, lastSignInAt: now };
    this.state.accounts.set(input.id, next);
    if (!this.state.identities.some(entry => entry.provider === "legacy_code" && entry.subject === input.id)) this.state.identities.push({ accountId: input.id, provider: "legacy_code", subject: input.id });
    return next;
  }

  async createAccount(input: NewAccount) {
    if (this.state.identities.some(entry => entry.provider === "email" && entry.subject === input.email)) return null;
    const record = { id: input.id, email: input.email, name: input.name, role: input.role, status: "active" as const, sessionVersion: 1, termsVersion: input.termsVersion, guardianDeclaration: input.guardianDeclaration, lastSignInAt: null };
    this.state.accounts.set(input.id, record);
    this.state.identities.push({ accountId: input.id, provider: "email", subject: input.email });
    return record;
  }

  async linkEmail(accountId: string, email: string) {
    const existing = this.state.identities.find(entry => entry.provider === "email" && entry.subject === email);
    if (existing) return existing.accountId === accountId;
    if ([...this.state.accounts.values()].some(account => account.email === email)) return false;
    this.state.identities.push({ accountId, provider: "email", subject: email });
    const account = this.state.accounts.get(accountId);
    if (account && !account.email) this.state.accounts.set(accountId, { ...account, email });
    return true;
  }

  async ensureGoogleAccount(input: Readonly<{ id: string; email: string; name: string; role: AccountRole }>) {
    if (!this.state.accounts.has(input.id)) {
      const emailTaken = [...this.state.accounts.values()].some(account => account.email === input.email);
      this.state.accounts.set(input.id, { id: input.id, email: emailTaken ? null : input.email, name: input.name, role: input.role, status: "active", sessionVersion: 1, termsVersion: null, guardianDeclaration: null, lastSignInAt: null });
    }
    if (!this.state.identities.some(entry => entry.provider === "google" && entry.subject === input.email)) this.state.identities.push({ accountId: input.id, provider: "google", subject: input.email });
    return this.state.accounts.get(input.id)!;
  }

  async touchSignIn(id: string, now: Date) {
    const account = this.state.accounts.get(id);
    if (account) this.state.accounts.set(id, { ...account, lastSignInAt: now });
  }

  async createEmailCode(input: Omit<EmailCodeRecord, "id" | "attempts" | "consumedAt">) {
    this.state.codes.push({ ...input, id: crypto.randomUUID(), attempts: 0, consumedAt: null });
  }

  async countCodesSince(email: string, since: Date) { return this.state.codes.filter(code => code.email === email && code.createdAt > since).length; }

  async latestOpenCode(email: string, now: Date) {
    return this.state.codes.filter(code => code.email === email && !code.consumedAt && code.expiresAt > now).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
  }

  async recordCodeAttempt(id: string) {
    const index = this.state.codes.findIndex(code => code.id === id);
    if (index >= 0) this.state.codes[index] = { ...this.state.codes[index], attempts: this.state.codes[index].attempts + 1 };
  }

  async consumeCode(id: string, now: Date) {
    const index = this.state.codes.findIndex(code => code.id === id && !code.consumedAt);
    if (index < 0) return false;
    this.state.codes[index] = { ...this.state.codes[index], consumedAt: now };
    return true;
  }
}
