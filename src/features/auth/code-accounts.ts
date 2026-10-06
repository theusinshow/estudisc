// Dev-created accounts that sign in with a numeric code (ADR 0031). Codes are stored only as scrypt
// hashes in the ESTUDISC_ACCOUNTS environment variable; sessions are HMAC-signed cookies keyed by
// AUTH_SECRET. No path aliases here: scripts/*.mjs import this file directly. Hashes use ":" separators
// because Next expands "$NAME" inside .env files.
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const ACCOUNT_SESSION_COOKIE = "estudisc_session";
export const LEGACY_ACCOUNT_SESSION_COOKIE = "kos_session";
export const ACCOUNT_SESSION_COOKIE_NAMES = [ACCOUNT_SESSION_COOKIE, LEGACY_ACCOUNT_SESSION_COOKIE] as const;
export const ACCOUNT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const ACCESS_CODE_PATTERN = /^\d{6}$/;
const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 32 };

const accountSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,64}$/),
  name: z.string().trim().min(1).max(40),
  role: z.enum(["ADMIN", "STUDENT"]),
  code: z.string().regex(/^scrypt:\d+:\d+:\d+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/)
}).strict();
const accountsSchema = z.array(accountSchema).min(1).max(20).superRefine((accounts, context) => {
  if (new Set(accounts.map((account) => account.id)).size !== accounts.length) context.addIssue({ code: "custom", message: "Duplicate account id" });
  if (new Set(accounts.map((account) => account.name.toLocaleLowerCase("pt-BR"))).size !== accounts.length) context.addIssue({ code: "custom", message: "Duplicate account name" });
});

export type CodeAccount = z.infer<typeof accountSchema>;
export type PublicAccount = Readonly<{ id: string; name: string }>;

/** Empty or missing means accounts mode is off; malformed configuration fails closed. */
export function parseCodeAccounts(raw: string | undefined): CodeAccount[] | null {
  if (!raw?.trim()) return null;
  return accountsSchema.parse(JSON.parse(raw));
}

export function publicAccounts(accounts: readonly CodeAccount[]): PublicAccount[] {
  return accounts.map(({ id, name }) => ({ id, name }));
}

export function hashAccessCode(code: string, salt = randomBytes(16)): string {
  if (!ACCESS_CODE_PATTERN.test(code)) throw new Error("Access code must have exactly 6 digits");
  const hash = scryptSync(code, salt, SCRYPT.keyLength, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64url"), hash.toString("base64url")].join(":");
}

export function verifyAccessCode(code: string, stored: string): boolean {
  if (!ACCESS_CODE_PATTERN.test(code)) return false;
  const [scheme, n, r, p, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(code, Buffer.from(salt, "base64url"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return timingSafeEqual(actual, expected);
}

// Changing an account's code changes this fingerprint, which invalidates its existing sessions.
function codeFingerprint(account: CodeAccount) {
  return createHash("sha256").update(account.code).digest("base64url").slice(0, 16);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAccountSession(account: CodeAccount, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ sub: account.id, v: codeFingerprint(account), exp: Math.floor(now / 1000) + ACCOUNT_SESSION_MAX_AGE_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function readAccountSession(token: string | undefined, accounts: readonly CodeAccount[], secret: string, now = Date.now()): CodeAccount | null {
  const [payload, signature, extra] = token?.split(".") ?? [];
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const claims = z.object({ sub: z.string(), v: z.string(), exp: z.number() }).parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    if (claims.exp * 1000 <= now) return null;
    const account = accounts.find((entry) => entry.id === claims.sub);
    return account && codeFingerprint(account) === claims.v ? account : null;
  } catch {
    return null;
  }
}

export function accountSessionCookieOptions(production: boolean) {
  return { httpOnly: true, sameSite: "lax" as const, secure: production, path: "/", maxAge: ACCOUNT_SESSION_MAX_AGE_SECONDS };
}

/** Read signed sessions under the canonical cookie or the deprecated name; writes use Estudisc. */
export function readAccountSessionFromCookies(cookies: { get(name: string): { value: string } | undefined }, accounts: readonly CodeAccount[], secret: string, now = Date.now()): CodeAccount | null {
  for (const name of ACCOUNT_SESSION_COOKIE_NAMES) {
    const account = readAccountSession(cookies.get(name)?.value, accounts, secret, now);
    if (account) return account;
  }
  return null;
}
