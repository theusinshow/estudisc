import { getDatabase, getDatabaseUrl } from "@/db/connection";
import { DrizzleAccountRepository, MemoryAccountRepository, type AccountRecord, type AccountStore } from "@/db/repositories/account-repository";
import { getServerEnv, type ServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";
import { AccountService } from "./account-service";
import { createEmailSender } from "./email-delivery";
import { readUserSession, USER_SESSION_COOKIE } from "./user-session";

export function getAccountStore(): AccountStore {
  return getDatabaseUrl() === "memory://local" ? new MemoryAccountRepository() : new DrizzleAccountRepository(getDatabase());
}

export function getAccountService(env: ServerEnv = getServerEnv()) {
  if (!env.AUTH_SECRET) throw new Error("AUTH_SECRET is required for account sign-in");
  return new AccountService({ store: getAccountStore(), sender: createEmailSender(env), secret: env.AUTH_SECRET, signupOpen: env.FEATURE_OPEN_SIGNUP, adminEmails: env.ESTUDISC_ADMIN_GOOGLE_EMAILS });
}

/** The signed cookie, checked against the account: disabled accounts and bumped session versions are signed out. */
export async function readSignedInAccount(cookies: { get(name: string): { value: string } | undefined }, env: ServerEnv = getServerEnv()): Promise<AccountRecord | null> {
  const claims = readUserSession(cookies.get(USER_SESSION_COOKIE)?.value, env.AUTH_SECRET);
  if (!claims || !getDatabaseUrl()) return null;
  const account = await getAccountStore().findById(claims.sub);
  return account && account.status === "active" && account.sessionVersion === claims.sv ? account : null;
}

/** Best effort on code sign-in: the profile gets its account record (same id); sign-in never depends on it. */
export async function recordLegacyAccount(account: Readonly<{ id: string; name: string; role: "ADMIN" | "STUDENT" }>) {
  try {
    if (!getDatabaseUrl()) return;
    await getAccountStore().upsertLegacyAccount(account, new Date());
  } catch {
    logEvent("warn", "legacy_account_upsert_failed", {});
  }
}
