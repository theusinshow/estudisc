import type { ServerEnv } from "@/lib/env";
import { getFeatureFlags } from "@/lib/feature-flags";

export function isGoogleAuthConfigured(env: ServerEnv) {
  return Boolean(env.AUTH_SECRET && env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
}

export function isAllowedGoogleEmail(email: string | null | undefined, env: ServerEnv) {
  if (!email) {
    return false;
  }

  if (env.ESTUDISC_ALLOWED_GOOGLE_EMAILS.includes(email.trim().toLowerCase())) return true;
  // ADR 0061: with paid access on, any Google account may sign in; the proxy gate requires an entitlement.
  return getFeatureFlags().FEATURE_PAID_ACCESS && isGoogleAuthConfigured(env);
}
