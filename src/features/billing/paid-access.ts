import { createHmac, timingSafeEqual } from "node:crypto";
import type { ServerEnv } from "@/lib/env";
import { getFeatureFlags } from "@/lib/feature-flags";
import { isGoogleAuthConfigured } from "@/features/auth/auth-readiness";

/** ADR 0061: paid access needs the flag and Google sign-in (customers create their own account). */
export function isPaidAccessEnabled(env: ServerEnv, flags = getFeatureFlags()) {
  return flags.FEATURE_PAID_ACCESS && isGoogleAuthConfigured(env);
}

/** Paths a visitor without a paid entitlement may open. */
export function isBillingOpenPath(pathname: string) {
  return pathname === "/assinar" || pathname.startsWith("/assinar/") || pathname === "/termos" || pathname === "/privacidade"
    || pathname.startsWith("/api/billing/");
}

export const ACCESS_COOKIE = "estudisc_access";
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 600;

/** Short-lived signed proof that the database granted access, so the proxy does not query on every request. */
export function signAccessCookie(ownerId: string, secret: string, now = Date.now()) {
  const expires = Math.floor(now / 1000) + ACCESS_COOKIE_MAX_AGE_SECONDS;
  const payload = `${Buffer.from(ownerId).toString("base64url")}.${expires}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export function verifyAccessCookie(value: string | undefined, ownerId: string, secret: string, now = Date.now()) {
  if (!value || !secret) return false;
  const [owner, expires, signature] = value.split(".");
  if (!owner || !expires || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${owner}.${expires}`).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
  return Buffer.from(owner, "base64url").toString() === ownerId && Number(expires) * 1000 > now;
}
