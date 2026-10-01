import { createHash } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { isAllowedGoogleEmail, isGoogleAuthConfigured } from "./auth-readiness";

export class AccessDeniedError extends Error { constructor() { super("Access denied"); } }
export function profileForEmail(email: string, env = getServerEnv()) {
  const normalized = email.trim().toLowerCase();
  if (!isAllowedGoogleEmail(normalized, env)) throw new AccessDeniedError();
  return { ownerId: `google-${createHash("sha256").update(normalized).digest("hex")}`, role: env.KNOW_OS_ADMIN_GOOGLE_EMAILS.includes(normalized) ? "ADMIN" as const : "STUDENT" as const };
}
export async function getOwnerProfile() {
  const env = getServerEnv();
  if (!isGoogleAuthConfigured(env)) {
    if (process.env.NODE_ENV === "production") throw new AccessDeniedError();
    return { ownerId: env.KNOW_OS_OWNER_ID, role: "ADMIN" as const };
  }
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.email) throw new AccessDeniedError();
  return profileForEmail(session.user.email, env);
}
export async function getOwnerId() { return (await getOwnerProfile()).ownerId; }
export async function requireAdmin() { const profile = await getOwnerProfile(); if (profile.role !== "ADMIN") throw new AccessDeniedError(); return profile; }
