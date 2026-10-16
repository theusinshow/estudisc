import type { ServerEnv } from "@/lib/env";

import { isAllowedGoogleEmail, isGoogleAuthConfigured } from "./auth-readiness";

export type AuthGuardDecision = "allow" | "unauthenticated" | "forbidden";

export function getAuthGuardDecision(email: string | null | undefined, env: ServerEnv): AuthGuardDecision {
  if (!isGoogleAuthConfigured(env)) {
    return "allow";
  }

  if (!email) {
    return "unauthenticated";
  }

  return isAllowedGoogleEmail(email, env) ? "allow" : "forbidden";
}

/** Sales and legal pages that visitors read before creating an account. */
export const PUBLIC_SITE_PATHS = ["/conheca", "/termos", "/privacidade"] as const;
export function isPublicSitePath(pathname: string) { return (PUBLIC_SITE_PATHS as readonly string[]).includes(pathname); }

export function isPublicRuntimePath(pathname: string) {
  return (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/payments/mercadopago/webhook" ||
    pathname === "/auth/signin" ||
    isPublicSitePath(pathname) ||
    pathname === "/api/health/db" ||
    pathname.startsWith("/branding/") ||
    pathname === "/favicon.ico"
  );
}

export function isAdminRuntimePath(pathname: string) {
  return (
    pathname === "/import" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/import/") ||
    pathname.startsWith("/api/generation/") ||
    pathname.startsWith("/api/restore")
  );
}
