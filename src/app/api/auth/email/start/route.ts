import { NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema, signupSchema } from "@/features/auth/account-service";
import { getAccountService, getAccountStore } from "@/features/auth/accounts";
import { EmailUnavailableError } from "@/features/auth/email-delivery";
import { allowCodeSend, requestIp } from "@/features/auth/email-rate-limit";
import { isAllowedMutationOrigin } from "@/features/auth/mutation-origin";
import { AccessDeniedError, getOwnerProfile } from "@/features/auth/owner";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const bodySchema = z.object({ email: emailSchema, intent: z.enum(["signin", "signup", "link"]), signup: signupSchema.optional() }).strict();

/** Sends a 6-digit code (ADR 0068). The answer is the same whether or not the e-mail has an account. */
export async function POST(request: Request) {
  const env = getServerEnv();
  if (!isAllowedMutationOrigin(request.headers, new URL(request.url), env.APP_URL)) return NextResponse.json({ code: "origin_rejected" }, { status: 403, headers: noStore });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.intent === "signup" && !parsed.data.signup)) return NextResponse.json({ code: "invalid_request", message: "Confira o e-mail e os dados do cadastro." }, { status: 400, headers: noStore });
  if (!allowCodeSend(requestIp(request.headers))) return NextResponse.json({ code: "too_many_requests", message: "Muitos códigos pedidos. Espere um pouco e tente de novo." }, { status: 429, headers: noStore });
  let accountId: string | undefined;
  if (parsed.data.intent === "link") {
    try {
      const profile = await getOwnerProfile();
      accountId = profile.ownerId;
      // Profiles signed in before accounts existed get their account record now, with the same id.
      const store = getAccountStore();
      if (!await store.findById(accountId)) await store.upsertLegacyAccount({ id: accountId, name: profile.name ?? "Estudante", role: profile.role }, new Date());
    } catch (error) {
      if (error instanceof AccessDeniedError) return NextResponse.json({ code: "auth_required", message: "Entre no seu perfil para ligar um e-mail." }, { status: 401, headers: noStore });
      throw error;
    }
  }
  try {
    const result = await getAccountService(env).startEmailCode(parsed.data.email, parsed.data.intent, { accountId, signup: parsed.data.signup });
    if (result.status === "throttled") return NextResponse.json({ code: "too_many_requests", message: "Você já pediu vários códigos. Espere uma hora ou use o último código recebido." }, { status: 429, headers: noStore });
    if (result.status === "signup_closed") return NextResponse.json({ code: "signup_closed", message: "O cadastro ainda não está aberto. Peça acesso pelo suporte." }, { status: 403, headers: noStore });
    return NextResponse.json({ status: "sent" }, { headers: noStore });
  } catch (error) {
    if (error instanceof EmailUnavailableError) {
      logEvent("error", "email_code_unavailable", {});
      return NextResponse.json({ code: "email_unavailable", message: "Não conseguimos enviar o e-mail agora. Tente de novo em alguns minutos." }, { status: 503, headers: noStore });
    }
    throw error;
  }
}
