import type { ServerEnv } from "@/lib/env";
import { parseCodeAccounts, type CodeAccount } from "./code-accounts";

export class AccountConfigurationError extends Error {
  constructor(message: string) { super(message); }
}

export type AccountConfig = Readonly<{ accounts: CodeAccount[]; secret: string }>;

/** Accounts mode is on when KNOW_OS_ACCOUNTS lists accounts; it then takes precedence over Google OAuth. */
export function getAccountConfig(env: ServerEnv): AccountConfig | null {
  const accounts = parseCodeAccounts(env.KNOW_OS_ACCOUNTS);
  if (!accounts) return null;
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) throw new AccountConfigurationError("KNOW_OS_ACCOUNTS requires AUTH_SECRET with at least 32 characters.");
  return { accounts, secret: env.AUTH_SECRET };
}
