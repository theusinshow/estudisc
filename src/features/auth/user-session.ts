import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { AccountRole } from "@/db/repositories/account-repository";

/** ADR 0068: one signed cookie for accounts signed in by e-mail, Google or a linked code profile. */
export const USER_SESSION_COOKIE = "estudisc_user";
export const USER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type UserSessionClaims = Readonly<{ sub: string; role: AccountRole; sv: number; exp: number }>;
const claimsSchema = z.object({ sub: z.string().min(1).max(160), role: z.enum(["ADMIN", "STUDENT"]), sv: z.number().int().positive(), exp: z.number() }).strict();

const sign = (payload: string, secret: string) => createHmac("sha256", `user-session:${secret}`).update(payload).digest("base64url");

export function createUserSession(account: Readonly<{ id: string; role: AccountRole; sessionVersion: number }>, secret: string, now = Date.now()) {
  const claims: UserSessionClaims = { sub: account.id, role: account.role, sv: account.sessionVersion, exp: Math.floor(now / 1000) + USER_SESSION_MAX_AGE_SECONDS };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Signature and expiry only: the proxy has no database. Owner resolution also checks status and version. */
export function readUserSession(token: string | undefined, secret: string | undefined, now = Date.now()): UserSessionClaims | null {
  if (!token || !secret) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, secret)), actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const claims = claimsSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    return claims.exp * 1000 > now ? claims : null;
  } catch {
    return null;
  }
}

export function userSessionCookieOptions(production: boolean) {
  return { httpOnly: true, sameSite: "lax" as const, secure: production, path: "/", maxAge: USER_SESSION_MAX_AGE_SECONDS };
}
