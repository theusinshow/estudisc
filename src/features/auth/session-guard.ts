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

export function isPublicRuntimePath(pathname: string) {
  return (
    pathname.startsWith("/api/auth") ||
    pathname === "/auth/signin" ||
    pathname === "/api/health/db" ||
    pathname.startsWith("/branding/") ||
    pathname === "/favicon.ico"
  );
}
export function isAdminRuntimePath(pathname:string){return pathname==="/import"||pathname.startsWith("/admin")||pathname.startsWith("/api/admin/")||pathname.startsWith("/api/import/")||pathname.startsWith("/api/generation/")||pathname.startsWith("/api/restore");}
