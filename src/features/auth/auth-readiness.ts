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

export const EMAIL_CODE_PROVIDER_ID = "email-code";

/** Email one-time codes (ADR 0068): flag on, a strong AUTH_SECRET, and Resend in production. */
export function isEmailCodeSignInConfigured(env: ServerEnv, nodeEnv = process.env.NODE_ENV) {
  if (!env.FEATURE_EMAIL_CODE_SIGNIN || !env.AUTH_SECRET || env.AUTH_SECRET.length < 32) return false;
  return nodeEnv !== "production" || Boolean(env.RESEND_API_KEY && env.ESTUDISC_EMAIL_FROM);
}

/** An Auth.js session provider (Google or email code) is configured, so private routes require sign-in. */
export function isSessionAuthConfigured(env: ServerEnv) {
  return isGoogleAuthConfigured(env) || isEmailCodeSignInConfigured(env);
}
