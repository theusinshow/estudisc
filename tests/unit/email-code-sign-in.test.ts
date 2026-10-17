import { beforeEach, describe, expect, it, vi } from "vitest";

import { MemoryEmailLoginRepository, resetMemoryEmailLogin } from "@/db/repositories/email-login-repository";
import { isEmailCodeSignInConfigured, isSessionAuthConfigured } from "@/features/auth/auth-readiness";
import { EMAIL_CODE_MAX_ATTEMPTS, requestEmailCode, verifyEmailCode } from "@/features/auth/email-code";
import { getEmailSender, MemoryEmailSender, ResendEmailSender, type EmailMessage } from "@/features/auth/email-sender";
import { profileForEmail } from "@/features/auth/owner";
import { getAuthGuardDecision } from "@/features/auth/session-guard";
import { getServerEnv } from "@/lib/env";

const secret = "12345678901234567890123456789012";
const start = new Date("2026-10-17T12:00:00Z");

function setup() {
  const sent: EmailMessage[] = [];
  let now = start;
  const deps = {
    repository: new MemoryEmailLoginRepository(),
    sender: { send: async (message: EmailMessage) => { sent.push(message); } },
    secret,
    now: () => now
  };
  const advance = (ms: number) => { now = new Date(now.getTime() + ms); };
  const lastCode = () => /\b(\d{6})\b/.exec(sent.at(-1)?.text ?? "")?.[1] ?? "";
  return { deps, sent, advance, lastCode };
}

beforeEach(() => resetMemoryEmailLogin());

describe("email one-time code (ADR 0068)", () => {
  it("sends a 6-digit code that signs in once, for the normalized email", async () => {
    const { deps, sent, lastCode } = setup();
    expect(await requestEmailCode({ email: "  Aluna@Example.com ", ip: "1.1.1.1" }, deps)).toEqual({ status: "sent" });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe("aluna@example.com");
    const code = lastCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(await verifyEmailCode({ email: "ALUNA@example.com", code }, deps)).toEqual({ ok: true, email: "aluna@example.com" });
    expect(await verifyEmailCode({ email: "aluna@example.com", code }, deps)).toEqual({ ok: false, reason: "expired_or_missing" });
  });

  it("never stores the email or the code in clear text", async () => {
    const { deps, lastCode } = setup();
    await requestEmailCode({ email: "aluna@example.com", ip: "1.1.1.1" }, deps);
    const stored = JSON.stringify((globalThis as { __estudiscEmailLogin?: unknown }).__estudiscEmailLogin);
    expect(stored).not.toContain("aluna@example.com");
    expect(stored).not.toContain(lastCode());
  });

  it("rejects expired codes and older codes once a new one is issued", async () => {
    const { deps, advance, lastCode } = setup();
    await requestEmailCode({ email: "a@example.com", ip: "ip" }, deps);
    const first = lastCode();
    advance(60_000);
    await requestEmailCode({ email: "a@example.com", ip: "ip" }, deps);
    const second = lastCode();
    if (first !== second) expect(await verifyEmailCode({ email: "a@example.com", code: first }, deps)).toMatchObject({ ok: false });
    advance(10 * 60_000 + 1);
    expect(await verifyEmailCode({ email: "a@example.com", code: second }, deps)).toEqual({ ok: false, reason: "expired_or_missing" });
  });

  it("locks a code after the maximum number of wrong attempts", async () => {
    const { deps, lastCode } = setup();
    await requestEmailCode({ email: "a@example.com", ip: "ip" }, deps);
    const code = lastCode();
    const wrong = code === "000000" ? "111111" : "000000";
    for (let attempt = 1; attempt < EMAIL_CODE_MAX_ATTEMPTS; attempt += 1) {
      expect(await verifyEmailCode({ email: "a@example.com", code: wrong }, deps)).toEqual({ ok: false, reason: "invalid_code" });
    }
    expect(await verifyEmailCode({ email: "a@example.com", code: wrong }, deps)).toEqual({ ok: false, reason: "too_many_attempts" });
    expect(await verifyEmailCode({ email: "a@example.com", code }, deps)).toEqual({ ok: false, reason: "too_many_attempts" });
  });

  it("rate limits per email and per IP", async () => {
    const { deps, sent, advance } = setup();
    for (let index = 0; index < 3; index += 1) expect((await requestEmailCode({ email: "a@example.com", ip: "ip-a" }, deps)).status).toBe("sent");
    expect(await requestEmailCode({ email: "a@example.com", ip: "ip-b" }, deps)).toMatchObject({ status: "rate_limited" });
    advance(10 * 60_000 + 1);
    expect((await requestEmailCode({ email: "a@example.com", ip: "ip-a" }, deps)).status).toBe("sent");
    for (let index = 0; index < 16; index += 1) await requestEmailCode({ email: `u${index}@example.com`, ip: "ip-c" }, deps);
    const before = sent.length;
    for (let index = 16; index < 30; index += 1) await requestEmailCode({ email: `u${index}@example.com`, ip: "ip-c" }, deps);
    expect(sent.length - before).toBe(4);
  });

  it("answers 'sent' without delivering when the address is not accepted", async () => {
    const { deps, sent } = setup();
    expect(await requestEmailCode({ email: "blocked@example.com", ip: "ip", deliver: false }, deps)).toEqual({ status: "sent" });
    expect(sent).toHaveLength(0);
  });

  it("validates input before touching storage", async () => {
    const { deps } = setup();
    expect(await requestEmailCode({ email: "not-an-email", ip: "ip" }, deps)).toEqual({ status: "invalid_email" });
    expect(await verifyEmailCode({ email: "a@example.com", code: "12ab56" }, deps)).toEqual({ ok: false, reason: "invalid_input" });
  });
});

describe("email code configuration and identity", () => {
  const emailEnv = getServerEnv({ AUTH_SECRET: secret, FEATURE_EMAIL_CODE_SIGNIN: "true", FEATURE_PAID_ACCESS: "true" });

  it("requires the flag and a strong secret, and Resend in production", () => {
    expect(isEmailCodeSignInConfigured(getServerEnv({ AUTH_SECRET: secret }), "development")).toBe(false);
    expect(isEmailCodeSignInConfigured(getServerEnv({ AUTH_SECRET: "short", FEATURE_EMAIL_CODE_SIGNIN: "true" }), "development")).toBe(false);
    expect(isEmailCodeSignInConfigured(emailEnv, "development")).toBe(true);
    expect(isEmailCodeSignInConfigured(emailEnv, "production")).toBe(false);
    const withResend = getServerEnv({ AUTH_SECRET: secret, FEATURE_EMAIL_CODE_SIGNIN: "true", RESEND_API_KEY: "re_test", ESTUDISC_EMAIL_FROM: "Estudisc <nao-responda@example.com>" });
    expect(isEmailCodeSignInConfigured(withResend, "production")).toBe(true);
    expect(getEmailSender(withResend, "production")).toBeInstanceOf(ResendEmailSender);
    expect(getEmailSender(emailEnv, "production")).toBeNull();
    expect(getEmailSender(emailEnv, "development")).toBeInstanceOf(MemoryEmailSender);
  });

  it("makes private routes require a session when only email codes are configured", () => {
    expect(isSessionAuthConfigured(emailEnv)).toBe(true);
    expect(getAuthGuardDecision(undefined, emailEnv)).toBe("unauthenticated");
    expect(getAuthGuardDecision("aluna@example.com", emailEnv)).toBe("allow");
  });

  it("maps an email-code identity to the same ownerId as Google", () => {
    expect(profileForEmail("Aluna@Example.com", emailEnv).ownerId).toBe(profileForEmail("aluna@example.com", emailEnv).ownerId);
    expect(profileForEmail("aluna@example.com", emailEnv).ownerId).toMatch(/^google-[0-9a-f]{64}$/);
  });

  it("sends through Resend with the configured sender and surfaces failures", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    await new ResendEmailSender("re_key", "Estudisc <a@example.com>", fetchImpl as unknown as typeof fetch).send({ to: "b@example.com", subject: "s", text: "t" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_key");
    expect(JSON.parse(String(init.body))).toMatchObject({ from: "Estudisc <a@example.com>", to: ["b@example.com"] });
    const failing = vi.fn(async () => new Response("{}", { status: 422 }));
    await expect(new ResendEmailSender("k", "f", failing as unknown as typeof fetch).send({ to: "b@example.com", subject: "s", text: "t" })).rejects.toThrow("422");
  });
});
