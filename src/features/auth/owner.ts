import { legacyGoogleOwnerId } from "./account-service";
import { getServerEnv } from "@/lib/env";
import { isAllowedGoogleEmail, isGoogleAuthConfigured, isLegacyAllowlistedGoogleEmail } from "./auth-readiness";
import { getAccountConfig, isHybridSignIn } from "./account-mode";
import { readAccountSessionFromCookies } from "./code-accounts";

export class AccessDeniedError extends Error {
  constructor() {
    super("Access denied");
  }
}

export function profileForEmail(email: string, env = getServerEnv()) {
  const normalized = email.trim().toLowerCase();
  if (!isAllowedGoogleEmail(normalized, env)) throw new AccessDeniedError();
  return {
    ownerId: legacyGoogleOwnerId(normalized),
    role: env.ESTUDISC_ADMIN_GOOGLE_EMAILS.includes(normalized) ? ("ADMIN" as const) : ("STUDENT" as const),
    email: normalized,
    allowlisted: isLegacyAllowlistedGoogleEmail(normalized, env)
  };
}

export type OwnerProfile = Readonly<{
  ownerId: string;
  role: "ADMIN" | "STUDENT";
  name?: string;
  email?: string;
  allowlisted?: boolean;
}>;

export async function getOwnerProfile(): Promise<OwnerProfile> {
  const env = getServerEnv();
  // ADR 0068: an account session (e-mail, Google or a linked code profile) resolves to its ownerId first.
  if (env.AUTH_SECRET) {
    const { cookies } = await import("next/headers");
    const { readSignedInAccount } = await import("./accounts");
    const account = await readSignedInAccount(await cookies(), env);
    if (account) return { ownerId: account.id, role: account.role, name: account.name, ...(account.email ? { email: account.email } : {}), allowlisted: account.id.startsWith("account-") || isLegacyAllowlistedGoogleEmail(account.email, env) };
  }
  const accountConfig = getAccountConfig(env);
  if (accountConfig) {
    const { cookies } = await import("next/headers");
    const account = readAccountSessionFromCookies(await cookies(), accountConfig.accounts, accountConfig.secret);
    if (account) return { ownerId: account.id, role: account.role, name: account.name, allowlisted: true };
    if (!isHybridSignIn(env)) throw new AccessDeniedError();
  }
  if (!isGoogleAuthConfigured(env)) {
    if (process.env.NODE_ENV === "production") throw new AccessDeniedError();
    return { ownerId: env.ESTUDISC_OWNER_ID, role: "ADMIN" as const, allowlisted: true };
  }
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.email) throw new AccessDeniedError();
  const profile = profileForEmail(session.user.email, env);
  return session.user.name ? { ...profile, name: session.user.name } : profile;
}

export async function getOwnerId() {
  return (await getOwnerProfile()).ownerId;
}

export async function requireAdmin() {
  const profile = await getOwnerProfile();
  if (profile.role !== "ADMIN") throw new AccessDeniedError();
  return profile;
}
