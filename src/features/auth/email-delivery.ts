import { logEvent } from "@/lib/logger";

export type OutgoingEmail = Readonly<{ to: string; subject: string; text: string; html: string }>;
export interface EmailSender { send(message: OutgoingEmail): Promise<void>; }

export class EmailUnavailableError extends Error {
  constructor() { super("E-mail delivery is not configured"); }
}

/** Resend over HTTPS (no SDK). Retries are left to the student ("Reenviar código"). */
export class ResendEmailSender implements EmailSender {
  constructor(private readonly apiKey: string, private readonly from: string) {}
  async send(message: OutgoingEmail) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ from: this.from, to: [message.to], subject: message.subject, text: message.text, html: message.html })
    });
    if (!response.ok) {
      logEvent("error", "email_delivery_failed", { status: response.status });
      throw new EmailUnavailableError();
    }
  }
}

/** Development and tests: messages stay in memory; production without RESEND_API_KEY refuses to send. */
export const memoryOutbox: OutgoingEmail[] = [];
export class MemoryEmailSender implements EmailSender {
  async send(message: OutgoingEmail) {
    memoryOutbox.push(message);
    // Local development only (this sender is never used in production): the subject carries the code.
    if (process.env.NODE_ENV === "development") console.info(`[dev e-mail] ${message.to}: ${message.subject}`);
  }
}

export function createEmailSender(env: Readonly<{ RESEND_API_KEY?: string; EMAIL_FROM?: string }>, production = process.env.NODE_ENV === "production"): EmailSender {
  if (env.RESEND_API_KEY) return new ResendEmailSender(env.RESEND_API_KEY, env.EMAIL_FROM ?? "Estudisc <acesso@estudisc.com.br>");
  if (production) return { async send() { throw new EmailUnavailableError(); } };
  return new MemoryEmailSender();
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]!);

/** The only template: a 6-digit code with its purpose and a safety note. */
export function signInCodeEmail(to: string, code: string, intent: "signin" | "signup" | "link"): OutgoingEmail {
  const purpose = intent === "signup" ? "criar sua conta" : intent === "link" ? "ligar este e-mail ao seu perfil" : "entrar";
  const subject = `${code} é seu código do Estudisc`;
  const text = `Seu código para ${purpose} no Estudisc é ${code}.\n\nEle vale por 10 minutos. Se não foi você que pediu, ignore este e-mail: ninguém entra sem o código.`;
  const html = `<p>Seu código para ${escapeHtml(purpose)} no Estudisc é:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${escapeHtml(code)}</p><p>Ele vale por 10 minutos. Se não foi você que pediu, ignore este e-mail: ninguém entra sem o código.</p>`;
  return { to, subject, text, html };
}
