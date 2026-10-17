import type { ServerEnv } from "@/lib/env";
import { isSessionAuthConfigured } from "./auth-readiness";
import { parseCodeAccounts, type CodeAccount } from "./code-accounts";

export class AccountConfigurationError extends Error {
  constructor(message: string) { super(message); }
}

export type AccountConfig = Readonly<{ accounts: CodeAccount[]; secret: string }>;

/** Accounts mode is on when ESTUDISC_ACCOUNTS lists accounts; it then takes precedence over Google OAuth. */
export function getAccountConfig(env: ServerEnv): AccountConfig | null {
  const accounts = parseCodeAccounts(env.ESTUDISC_ACCOUNTS);
  if (!accounts) return null;
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) throw new AccountConfigurationError("ESTUDISC_ACCOUNTS requires AUTH_SECRET with at least 32 characters.");
  return { accounts, secret: env.AUTH_SECRET };
}

/**
 * Paid access (ADR 0061) opens Google sign-up while code accounts keep working: with accounts, Google OAuth and
 * FEATURE_PAID_ACCESS all configured, a valid account cookie or a Google session is accepted.
 */
export function isHybridSignIn(env: ServerEnv) {
  return env.FEATURE_PAID_ACCESS && isSessionAuthConfigured(env) && getAccountConfig(env) !== null;
}
