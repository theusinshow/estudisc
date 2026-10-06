import type { ServerEnv } from "@/lib/env";

export function isGoogleAuthConfigured(env: ServerEnv) {
  return Boolean(env.AUTH_SECRET && env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
}

export function isAllowedGoogleEmail(email: string | null | undefined, env: ServerEnv) {
  if (!email) {
    return false;
  }

  return env.ESTUDISC_ALLOWED_GOOGLE_EMAILS.includes(email.trim().toLowerCase());
}
