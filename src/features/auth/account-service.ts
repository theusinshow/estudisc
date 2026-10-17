import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { AccountRecord, AccountRole, AccountStore, CodeIntent, GuardianDeclaration } from "@/db/repositories/account-repository";
import { signInCodeEmail, type EmailSender } from "./email-delivery";

/** Bump when /termos changes materially; stored with each sign-up. */
export const TERMS_VERSION = "2026-10-17";
export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;
export const MAX_CODES_PER_HOUR = 5;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const signupSchema = z.object({
  name: z.string().trim().min(2).max(60),
  minor: z.boolean(),
  /** Under 18: the student declares a guardian authorized the use (owner decision, ADR 0068). */
  guardianAuthorized: z.boolean(),
  acceptTerms: z.literal(true)
}).strict().refine(value => !value.minor || value.guardianAuthorized, { message: "guardian_authorization_required", path: ["guardianAuthorized"] });
export type SignupInput = z.infer<typeof signupSchema>;

export type AccountServiceDeps = Readonly<{
  store: AccountStore; sender: EmailSender; secret: string;
  signupOpen: boolean; adminEmails: readonly string[];
  now?: () => Date; newId?: () => string; generateCode?: () => string;
}>;

const hashCode = (secret: string, email: string, code: string) => createHmac("sha256", `email-code:${secret}`).update(`${email}:${code}`).digest("base64url");
const sameHash = (left: string, right: string) => { const a = Buffer.from(left), b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); };

export type StartResult = { status: "sent" } | { status: "throttled" } | { status: "signup_closed" };
export type VerifyResult =
  | { status: "signed_in"; account: AccountRecord }
  | { status: "linked"; account: AccountRecord }
  | { status: "no_account" } | { status: "email_taken" } | { status: "signup_closed" }
  | { status: "invalid" } | { status: "expired" } | { status: "locked" } | { status: "disabled" };

export class AccountService {
  private readonly now: () => Date;
  constructor(private readonly deps: AccountServiceDeps) { this.now = deps.now ?? (() => new Date()); }

  /** Always answers the same way for known and unknown e-mails, so sign-in never reveals who has an account. */
  async startEmailCode(email: string, intent: CodeIntent, options: Readonly<{ accountId?: string; signup?: SignupInput }> = {}): Promise<StartResult> {
    if (intent === "signup" && !this.deps.signupOpen) return { status: "signup_closed" };
    const now = this.now();
    if (await this.deps.store.countCodesSince(email, new Date(now.getTime() - 60 * 60 * 1000)) >= MAX_CODES_PER_HOUR) return { status: "throttled" };
    const code = this.deps.generateCode?.() ?? String(randomInt(0, 1_000_000)).padStart(6, "0");
    const payload = options.signup ? { name: options.signup.name, minor: options.signup.minor, guardianAuthorized: options.signup.guardianAuthorized, termsVersion: TERMS_VERSION } : {};
    await this.deps.store.createEmailCode({ email, codeHash: hashCode(this.deps.secret, email, code), intent, accountId: options.accountId ?? null, payload, expiresAt: new Date(now.getTime() + CODE_TTL_MS), createdAt: now });
    await this.deps.sender.send(signInCodeEmail(email, code, intent));
    return { status: "sent" };
  }

  async verifyEmailCode(email: string, code: string, sessionAccountId?: string): Promise<VerifyResult> {
    const now = this.now();
    const open = await this.deps.store.latestOpenCode(email, now);
    if (!open) return { status: "expired" };
    if (open.attempts >= MAX_CODE_ATTEMPTS) return { status: "locked" };
    if (!/^\d{6}$/.test(code) || !sameHash(open.codeHash, hashCode(this.deps.secret, email, code))) {
      await this.deps.store.recordCodeAttempt(open.id);
      return open.attempts + 1 >= MAX_CODE_ATTEMPTS ? { status: "locked" } : { status: "invalid" };
    }
    if (!await this.deps.store.consumeCode(open.id, now)) return { status: "expired" };

    if (open.intent === "link") {
      if (!open.accountId || open.accountId !== sessionAccountId) return { status: "invalid" };
      if (!await this.deps.store.linkEmail(open.accountId, email)) return { status: "email_taken" };
      const account = await this.deps.store.findById(open.accountId);
      return account ? { status: "linked", account } : { status: "invalid" };
    }

    const existing = await this.deps.store.findByIdentity("email", email);
    if (existing) return this.signIn(existing, now);
    if (open.intent === "signin") return { status: "no_account" };
    if (!this.deps.signupOpen) return { status: "signup_closed" };
    const signup = open.payload as { name?: string; minor?: boolean; guardianAuthorized?: boolean; termsVersion?: string };
    if (!signup.name || signup.minor === undefined || !signup.termsVersion) return { status: "invalid" };
    const guardianDeclaration: GuardianDeclaration | null = signup.minor ? { minor: true, declaredAt: now.toISOString() } : null;
    const role: AccountRole = this.deps.adminEmails.includes(email) ? "ADMIN" : "STUDENT";
    const created = await this.deps.store.createAccount({ id: this.deps.newId?.() ?? `user-${crypto.randomUUID()}`, email, name: signup.name, role, termsVersion: signup.termsVersion, termsAcceptedAt: now, guardianDeclaration });
    return created ? this.signIn(created, now) : { status: "email_taken" };
  }

  private async signIn(account: AccountRecord, now: Date): Promise<VerifyResult> {
    if (account.status !== "active") return { status: "disabled" };
    await this.deps.store.touchSignIn(account.id, now);
    return { status: "signed_in", account };
  }
}
