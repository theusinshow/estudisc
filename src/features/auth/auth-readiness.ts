import type { ServerEnv } from "@/lib/env";

export function isGoogleAuthConfigured(env: ServerEnv) {
  return Boolean(env.AUTH_SECRET && env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
}

export function isLegacyAllowlistedGoogleEmail(email: string | null | undefined, env: ServerEnv) {
  if (!email) {
    return false;
  }
  const normalized = email.trim().toLowerCase();
  return (
    env.ESTUDISC_ALLOWED_GOOGLE_EMAILS.includes(normalized) ||
    env.ESTUDISC_ADMIN_GOOGLE_EMAILS.includes(normalized)
  );
}

export function isAllowedGoogleEmail(email: string | null | undefined, env: ServerEnv) {
  if (!email?.trim()) {
    return false;
  }

  if (env.FEATURE_PAID_ACCESS) {
    return true;
  }

  return env.ESTUDISC_ALLOWED_GOOGLE_EMAILS.includes(email.trim().toLowerCase());
}
