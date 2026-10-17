import { afterEach, describe, expect, it } from "vitest";
import { DrizzleAccountRepository, MemoryAccountRepository, type AccountStore } from "@/db/repositories/account-repository";
import { AccountService, legacyGoogleOwnerId, MAX_CODE_ATTEMPTS, type AccountServiceDeps } from "@/features/auth/account-service";
import type { OutgoingEmail } from "@/features/auth/email-delivery";
import { attempts, owners, xpTransactions } from "@/db/schema";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

const closers: (() => Promise<void>)[] = [];
afterEach(async () => { while (closers.length) await closers.pop()!(); });

async function setup(kind: "memory" | "persistent", overrides: Partial<AccountServiceDeps> = {}) {
  let store: AccountStore, db: Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>>["db"] | undefined;
  if (kind === "persistent") {
    const database = await createMigratedPgliteTestDatabase();
    closers.push(() => database.close());
    store = new DrizzleAccountRepository(database.db); db = database.db;
  } else store = new MemoryAccountRepository({ accounts: new Map(), identities: [], codes: [] });
  const outbox: OutgoingEmail[] = [];
  let clock = new Date("2026-10-17T12:00:00Z");
  const codes = ["111111", "222222", "333333", "444444", "555555", "666666"];
  const service = new AccountService({ store, sender: { async send(message) { outbox.push(message); } }, secret: "s".repeat(40), signupOpen: true, adminEmails: [], now: () => clock, generateCode: () => codes.shift()!, newId: () => "user-new", ...overrides });
  return { store, db, outbox, service, tick: (ms: number) => { clock = new Date(clock.getTime() + ms); } };
}

describe.each(["memory", "persistent"] as const)("accounts and e-mail sign-in (%s)", kind => {
  it("signs a Google user in by e-mail code on the same account instead of creating a new one", async () => {
    const { store, service } = await setup(kind);
    const google = await store.ensureGoogleAccount({ id: legacyGoogleOwnerId("ana@example.com"), email: "ana@example.com", name: "Ana", role: "STUDENT" });
    await service.startEmailCode("ana@example.com", "signin");
    expect(await service.verifyEmailCode("ana@example.com", "111111")).toMatchObject({ status: "signed_in", account: { id: google.id } });
    expect((await store.findByIdentity("email", "ana@example.com"))?.id).toBe(google.id);
  });

  it("keeps a pre-account Google learner on the ADR 0061 ownerId when they sign up by e-mail", async () => {
    const { store, db, service } = await setup(kind);
    const legacyId = legacyGoogleOwnerId("bia@example.com");
    if (db) await db.insert(owners).values({ id: legacyId, displayName: "Bia" });
    else await store.ensureGoogleAccount({ id: legacyId, email: "bia@example.com", name: "Bia", role: "STUDENT" });
    await service.startEmailCode("bia@example.com", "signup", { signup: { name: "Bia", minor: false, guardianAuthorized: false, acceptTerms: true } });
    expect(await service.verifyEmailCode("bia@example.com", "111111")).toMatchObject({ status: "signed_in", account: { id: legacyId } });
  });

  it("still reports no account for an unknown e-mail on sign-in", async () => {
    const { service } = await setup(kind);
    await service.startEmailCode("nova@example.com", "signin");
    expect(await service.verifyEmailCode("nova@example.com", "111111")).toEqual({ status: "no_account" });
  });

  it("keeps an existing code profile on its ownerId and progress when it links an e-mail", async () => {
    const { store, db, service } = await setup(kind);
    if (db) {
      // Real progress recorded before accounts existed (ADR 0031 profile).
      await db.insert(owners).values({ id: "account-kaua", displayName: "Kauã" });
      await db.insert(xpTransactions).values({ ownerId: "account-kaua", amount: 20, reason: "question_independent_success", sourceType: "question", sourceId: "Q1" });
    }
    const legacy = await store.upsertLegacyAccount({ id: "account-kaua", name: "Kauã", role: "STUDENT" }, new Date());
    expect(legacy).toMatchObject({ id: "account-kaua", role: "STUDENT", email: null });

    expect(await service.startEmailCode("kaua@example.com", "link", { accountId: "account-kaua" })).toEqual({ status: "sent" });
    expect(await service.verifyEmailCode("kaua@example.com", "111111", "account-kaua")).toMatchObject({ status: "linked", account: { id: "account-kaua" } });

    // Signing in later by e-mail lands on the same ownerId, so the old progress is still there.
    await service.startEmailCode("kaua@example.com", "signin");
    expect(await service.verifyEmailCode("kaua@example.com", "222222")).toMatchObject({ status: "signed_in", account: { id: "account-kaua", email: "kaua@example.com" } });
    if (db) expect(await db.select().from(xpTransactions)).toMatchObject([{ ownerId: "account-kaua", amount: 20 }]);
    if (db) expect(await db.select().from(attempts)).toEqual([]);
  });

  it("creates a STUDENT account on sign-up with terms and the guardian declaration, and signs in an existing e-mail instead of duplicating", async () => {
    const { store, service, outbox } = await setup(kind);
    await service.startEmailCode("ana@example.com", "signup", { signup: { name: "Ana", minor: true, guardianAuthorized: true, acceptTerms: true } });
    expect(outbox[0]).toMatchObject({ to: "ana@example.com", subject: "111111 é seu código do Estudisc" });
    const created = await service.verifyEmailCode("ana@example.com", "111111");
    expect(created).toMatchObject({ status: "signed_in", account: { id: "user-new", role: "STUDENT", termsVersion: "2026-10-17", guardianDeclaration: { minor: true } } });
    await service.startEmailCode("ana@example.com", "signup", { signup: { name: "Ana de novo", minor: false, guardianAuthorized: false, acceptTerms: true } });
    expect(await service.verifyEmailCode("ana@example.com", "222222")).toMatchObject({ status: "signed_in", account: { id: "user-new", name: "Ana" } });
    expect(await store.findByIdentity("email", "ana@example.com")).toMatchObject({ id: "user-new" });
  });

  it("never reveals unknown e-mails on start, and answers no_account only after the code proves the inbox", async () => {
    const { service, outbox } = await setup(kind);
    expect(await service.startEmailCode("ninguem@example.com", "signin")).toEqual({ status: "sent" });
    expect(outbox).toHaveLength(1);
    expect(await service.verifyEmailCode("ninguem@example.com", "111111")).toEqual({ status: "no_account" });
  });

  it("makes codes single use, short-lived and limited in attempts and sends", async () => {
    const { service, tick } = await setup(kind);
    await service.startEmailCode("bia@example.com", "signin");
    expect(await service.verifyEmailCode("bia@example.com", "000000")).toEqual({ status: "invalid" });
    for (let index = 1; index < MAX_CODE_ATTEMPTS; index++) await service.verifyEmailCode("bia@example.com", "000000");
    expect(await service.verifyEmailCode("bia@example.com", "111111")).toEqual({ status: "locked" });
    await service.startEmailCode("bia@example.com", "signin");
    tick(11 * 60 * 1000);
    expect(await service.verifyEmailCode("bia@example.com", "222222")).toEqual({ status: "expired" });
    for (let index = 0; index < 3; index++) await service.startEmailCode("bia@example.com", "signin");
    expect(await service.startEmailCode("bia@example.com", "signin")).toEqual({ status: "throttled" });
  });

  it("keeps sign-up closed until FEATURE_OPEN_SIGNUP and refuses to link an e-mail that belongs to someone else", async () => {
    const closed = await setup(kind, { signupOpen: false });
    expect(await closed.service.startEmailCode("novo@example.com", "signup", { signup: { name: "Novo", minor: false, guardianAuthorized: false, acceptTerms: true } })).toEqual({ status: "signup_closed" });
    const { store, service } = await setup(kind);
    await service.startEmailCode("dono@example.com", "signup", { signup: { name: "Dono", minor: false, guardianAuthorized: false, acceptTerms: true } });
    await service.verifyEmailCode("dono@example.com", "111111");
    await store.upsertLegacyAccount({ id: "account-matheus", name: "Matheus", role: "ADMIN" }, new Date());
    await service.startEmailCode("dono@example.com", "link", { accountId: "account-matheus" });
    expect(await service.verifyEmailCode("dono@example.com", "222222", "account-matheus")).toEqual({ status: "email_taken" });
  });
});
