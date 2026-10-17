import type { ServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";

export type EmailMessage = Readonly<{ to: string; subject: string; text: string }>;

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export class EmailDeliveryError extends Error {
  constructor(public readonly status: number) {
    super(`Email delivery failed with status ${status}`);
  }
}

/** Resend over HTTPS (ADR 0068). The API key never leaves the server. */
export class ResendEmailSender implements EmailSender {
  constructor(private readonly apiKey: string, private readonly from: string, private readonly fetchImpl: typeof fetch = fetch) {}

  async send(message: EmailMessage) {
    const response = await this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [message.to], subject: message.subject, text: message.text }),
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) {
      logEvent("error", "email_delivery_failed", { status: response.status });
      throw new EmailDeliveryError(response.status);
    }
  }
}

const outboxGlobal = globalThis as typeof globalThis & { __estudiscEmailOutbox?: EmailMessage[] };

/** Development and test sender: keeps messages in memory and prints them, so the code can be read locally. */
export class MemoryEmailSender implements EmailSender {
  async send(message: EmailMessage) {
    (outboxGlobal.__estudiscEmailOutbox ??= []).push(message);
    console.info(`[estudisc dev email] to=${message.to} subject="${message.subject}"`);
  }
}

export function readMemoryOutbox(): readonly EmailMessage[] {
  return outboxGlobal.__estudiscEmailOutbox ?? [];
}

export function clearMemoryOutbox() {
  outboxGlobal.__estudiscEmailOutbox = [];
}

export function isResendConfigured(env: ServerEnv) {
  return Boolean(env.RESEND_API_KEY && env.ESTUDISC_EMAIL_FROM);
}

/** Production needs Resend; elsewhere an unconfigured sender falls back to the in-memory outbox. */
export function getEmailSender(env: ServerEnv, nodeEnv = process.env.NODE_ENV): EmailSender | null {
  if (env.RESEND_API_KEY && env.ESTUDISC_EMAIL_FROM) return new ResendEmailSender(env.RESEND_API_KEY, env.ESTUDISC_EMAIL_FROM);
  return nodeEnv === "production" ? null : new MemoryEmailSender();
}
