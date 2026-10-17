"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { signIn } from "@/auth";
import { getEmailLoginRepository } from "@/db/repositories/email-login-repository";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";
import { EMAIL_CODE_PROVIDER_ID, isAllowedGoogleEmail, isEmailCodeSignInConfigured } from "./auth-readiness";
import { emailSchema, requestEmailCode } from "./email-code";
import { getEmailSender } from "./email-sender";

/** `requestId` ties a verification answer to the code request it belongs to. */
export type EmailCodeFormState = Readonly<{ step: "email" | "code"; email: string; requestId?: string; error?: string; notice?: string }>;

function safeCallbackUrl(value: FormDataEntryValue | null) {
  const url = typeof value === "string" ? value : "/";
  return url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

async function clientIp() {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "local";
}

/** Step 1 (ADR 0068): send a code. The answer is the same for accepted and rejected addresses. */
export async function requestEmailCodeAction(_previous: EmailCodeFormState, formData: FormData): Promise<EmailCodeFormState> {
  const rawEmail = String(formData.get("email") ?? "");
  const env = getServerEnv();
  const sender = getEmailSender(env);
  if (!isEmailCodeSignInConfigured(env) || !env.AUTH_SECRET || !sender) {
    return { step: "email", email: rawEmail, error: "A entrada por e-mail não está disponível agora. Use a conta Google." };
  }
  const email = emailSchema.safeParse(rawEmail);
  if (!email.success) return { step: "email", email: rawEmail, error: "Digite um e-mail válido, como nome@exemplo.com." };
  try {
    const result = await requestEmailCode(
      { email: email.data, ip: await clientIp(), deliver: isAllowedGoogleEmail(email.data, env) },
      { repository: getEmailLoginRepository(), sender, secret: env.AUTH_SECRET }
    );
    if (result.status === "rate_limited") {
      return { step: "email", email: email.data, error: `Muitos pedidos de código. Espere ${Math.ceil(result.retryAfterSeconds / 60)} min e tente de novo.` };
    }
    if (result.status === "invalid_email") return { step: "email", email: rawEmail, error: "Digite um e-mail válido, como nome@exemplo.com." };
  } catch {
    logEvent("error", "auth_failure", { reasonCode: "email_code_delivery_failed" });
    return { step: "email", email: email.data, error: "Não conseguimos enviar o e-mail agora. Tente de novo em alguns minutos." };
  }
  return { step: "code", email: email.data, requestId: randomUUID(), notice: `Enviamos um código de 6 dígitos para ${email.data}. Ele vale por 10 minutos.` };
}

/** Step 2: Auth.js signs in only when the email-code provider accepts and consumes the code. */
export async function verifyEmailCodeAction(_previous: EmailCodeFormState, formData: FormData): Promise<EmailCodeFormState> {
  const email = String(formData.get("email") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  try {
    await signIn(EMAIL_CODE_PROVIDER_ID, { email, code: String(formData.get("code") ?? ""), redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
  } catch (error) {
    // A successful sign-in throws Next's redirect, which must propagate. Auth.js errors carry a string `type`.
    unstable_rethrow(error);
    if (error instanceof Error && typeof (error as { type?: unknown }).type === "string") {
      return { step: "code", email, requestId, error: "Código incorreto ou vencido. Confira o e-mail ou peça um novo código." };
    }
    throw error;
  }
  return { step: "code", email, requestId };
}
