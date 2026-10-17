import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { EmailLoginRepository } from "@/db/repositories/email-login-repository";
import type { EmailSender } from "./email-sender";

// Email one-time code sign-in (ADR 0068). The verified email is the identity: it maps to the same ownerId as Google.
export const EMAIL_CODE_LENGTH = 6;
export const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
export const EMAIL_CODE_MAX_ATTEMPTS = 5;
const MINUTE = 60 * 1000;
const RATE_LIMITS = [
  { kind: "email_code_email_10m", scope: "email", windowMs: 10 * MINUTE, max: 3 },
  { kind: "email_code_email_day", scope: "email", windowMs: 24 * 60 * MINUTE, max: 10 },
  { kind: "email_code_ip_hour", scope: "ip", windowMs: 60 * MINUTE, max: 20 }
] as const;
const PRUNE_AFTER_MS = 2 * 24 * 60 * MINUTE;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const emailCodeSchema = z.string().trim().regex(/^\d{6}$/);

export type EmailCodeDeps = Readonly<{ repository: EmailLoginRepository; sender: EmailSender; secret: string; now?: () => Date }>;

export type RequestEmailCodeResult =
  | { status: "sent" }
  | { status: "invalid_email" }
  | { status: "rate_limited"; retryAfterSeconds: number };

export type VerifyEmailCodeResult = { ok: true; email: string } | { ok: false; reason: "invalid_input" | "invalid_code" | "expired_or_missing" | "too_many_attempts" };

function keyedHash(secret: string, purpose: string, value: string) {
  return createHmac("sha256", secret).update(`${purpose}:${value}`).digest("hex");
}

export function emailLookupHash(secret: string, email: string) {
  return keyedHash(secret, "email-login", email);
}

function codeHash(secret: string, emailHash: string, code: string) {
  return keyedHash(secret, `email-code:${emailHash}`, code);
}

export function generateEmailCode() {
  return String(randomInt(0, 10 ** EMAIL_CODE_LENGTH)).padStart(EMAIL_CODE_LENGTH, "0");
}

/**
 * Issues a code unless a rate limit is hit. `deliver=false` (for example an address the allowlist rejects) still
 * spends the limits and answers "sent", so the response never reveals which addresses are accepted.
 */
export async function requestEmailCode(
  input: Readonly<{ email: string; ip: string; deliver?: boolean }>,
  deps: EmailCodeDeps
): Promise<RequestEmailCodeResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return { status: "invalid_email" };
  const email = parsed.data;
  const now = deps.now?.() ?? new Date();
  const emailHash = emailLookupHash(deps.secret, email);
  const ipKey = keyedHash(deps.secret, "ip", input.ip);

  for (const limit of RATE_LIMITS) {
    const key = limit.scope === "email" ? emailHash : ipKey;
    const used = await deps.repository.countRateEvents(limit.kind, key, new Date(now.getTime() - limit.windowMs));
    if (used >= limit.max) return { status: "rate_limited", retryAfterSeconds: Math.ceil(limit.windowMs / 1000) };
  }
  for (const limit of RATE_LIMITS) await deps.repository.recordRateEvent(limit.kind, limit.scope === "email" ? emailHash : ipKey, now);
  await deps.repository.pruneBefore(new Date(now.getTime() - PRUNE_AFTER_MS));

  if (input.deliver === false) return { status: "sent" };
  const code = generateEmailCode();
  await deps.repository.insertCode({ emailHash, codeHash: codeHash(deps.secret, emailHash, code), expiresAt: new Date(now.getTime() + EMAIL_CODE_TTL_MS), createdAt: now });
  await deps.sender.send({
    to: email,
    subject: `${code} é o seu código do Estudisc`,
    text: `Seu código para entrar no Estudisc é ${code}.\n\nEle vale por 10 minutos. Se você não pediu este código, ignore este e-mail.`
  });
  return { status: "sent" };
}

/** Checks the latest active code for the email; a success consumes it, so each code signs in at most once. */
export async function verifyEmailCode(input: Readonly<{ email: string; code: string }>, deps: Omit<EmailCodeDeps, "sender">): Promise<VerifyEmailCodeResult> {
  const email = emailSchema.safeParse(input.email);
  const code = emailCodeSchema.safeParse(input.code);
  if (!email.success || !code.success) return { ok: false, reason: "invalid_input" };
  const now = deps.now?.() ?? new Date();
  const emailHash = emailLookupHash(deps.secret, email.data);
  const record = await deps.repository.findActiveCode(emailHash, now);
  if (!record) return { ok: false, reason: "expired_or_missing" };
  if (record.attempts >= EMAIL_CODE_MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };
  const attempts = await deps.repository.incrementAttempts(record.id);
  if (attempts > EMAIL_CODE_MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  const expected = Buffer.from(record.codeHash, "hex");
  const actual = Buffer.from(codeHash(deps.secret, emailHash, code.data), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, reason: attempts >= EMAIL_CODE_MAX_ATTEMPTS ? "too_many_attempts" : "invalid_code" };
  }
  if (!(await deps.repository.consumeCode(record.id, now))) return { ok: false, reason: "expired_or_missing" };
  return { ok: true, email: email.data };
}
