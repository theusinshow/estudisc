import { NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema } from "@/features/auth/account-service";
import { getAccountService } from "@/features/auth/accounts";
import { isAllowedMutationOrigin } from "@/features/auth/mutation-origin";
import { getOwnerProfile } from "@/features/auth/owner";
import { createUserSession, USER_SESSION_COOKIE, userSessionCookieOptions } from "@/features/auth/user-session";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const bodySchema = z.object({ email: emailSchema, code: z.string().trim().max(12) }).strict();

const messages: Record<string, [number, string]> = {
  invalid: [401, "Código incorreto. Confira o último e-mail que chegou."],
  expired: [410, "Esse código expirou ou já foi usado. Peça um novo."],
  locked: [429, "Muitas tentativas com esse código. Peça um novo."],
  no_account: [404, "Não encontramos uma conta com esse e-mail."],
  email_taken: [409, "Esse e-mail já está ligado a outra conta."],
  signup_closed: [403, "O cadastro ainda não está aberto. Peça acesso pelo suporte."],
  disabled: [403, "Esta conta está desativada. Fale com o suporte."]
};

/** Checks the code and opens the account session (ADR 0068). */
export async function POST(request: Request) {
  const env = getServerEnv();
  if (!env.AUTH_SECRET) return NextResponse.json({ code: "unavailable" }, { status: 503, headers: noStore });
  if (!isAllowedMutationOrigin(request.headers, new URL(request.url), env.APP_URL)) return NextResponse.json({ code: "origin_rejected" }, { status: 403, headers: noStore });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "invalid_request", message: "Digite o código de 6 dígitos." }, { status: 400, headers: noStore });
  const sessionAccountId = await getOwnerProfile().then(profile => profile.ownerId, () => undefined);
  const result = await getAccountService(env).verifyEmailCode(parsed.data.email, parsed.data.code, sessionAccountId);
  if (result.status !== "signed_in" && result.status !== "linked") {
    const [status, message] = messages[result.status];
    return NextResponse.json({ code: result.status, message }, { status, headers: noStore });
  }
  const response = NextResponse.json({ status: result.status, name: result.account.name }, { headers: noStore });
  response.cookies.set(USER_SESSION_COOKIE, createUserSession(result.account, env.AUTH_SECRET), userSessionCookieOptions(process.env.NODE_ENV === "production"));
  return response;
}
