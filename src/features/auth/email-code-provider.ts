import { getEmailLoginRepository } from "@/db/repositories/email-login-repository";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";
import { verifyEmailCode } from "./email-code";

/** Auth.js `authorize` for the email-code provider: returns the user only for a valid, now consumed code. */
export async function verifyEmailCodeFromCredentials(credentials: Partial<Record<string, unknown>> | undefined) {
  const secret = getServerEnv().AUTH_SECRET;
  if (!secret) return null;
  const result = await verifyEmailCode(
    { email: String(credentials?.email ?? ""), code: String(credentials?.code ?? "") },
    { repository: getEmailLoginRepository(), secret }
  );
  if (!result.ok) {
    logEvent("warn", "auth_failure", { reasonCode: `email_code_${result.reason}` });
    return null;
  }
  return { id: result.email, email: result.email };
}
