import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { EMAIL_CODE_PROVIDER_ID, isAllowedGoogleEmail, isEmailCodeSignInConfigured, isGoogleAuthConfigured } from "@/features/auth/auth-readiness";
import { googleAuthorizationParams } from "@/features/auth/google-oauth";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";
import { logFunnelEvent } from "@/lib/funnel-events";

const env = getServerEnv();
const googleAuthConfigured = isGoogleAuthConfigured(env);
const emailCodeConfigured = isEmailCodeSignInConfigured(env);

export const authConfig = {
  providers: [
    ...(googleAuthConfigured
      ? [
          Google({
            authorization: {
              params: googleAuthorizationParams
            }
          })
        ]
      : []),
    // Email one-time code (ADR 0068): the session carries only the verified email, like Google.
    ...(emailCodeConfigured
      ? [
          Credentials({
            id: EMAIL_CODE_PROVIDER_ID,
            credentials: { email: {}, code: {} },
            async authorize(credentials) {
              const { verifyEmailCodeFromCredentials } = await import("@/features/auth/email-code-provider");
              return verifyEmailCodeFromCredentials(credentials);
            }
          })
        ]
      : [])
  ],
  secret: env.AUTH_SECRET,
  trustHost: env.AUTH_TRUST_HOST ?? Boolean(process.env.VERCEL),
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  callbacks: {
    signIn({ account, profile, user }) {
      const viaEmailCode = account?.provider === EMAIL_CODE_PROVIDER_ID;
      if (viaEmailCode ? !emailCodeConfigured : !googleAuthConfigured) {
        logEvent("warn", "auth_failure", { reasonCode: "provider_not_configured" });
        return false;
      }

      const allowed = isAllowedGoogleEmail(viaEmailCode ? user?.email : profile?.email, env);
      if (!allowed) logEvent("warn", "auth_failure", { reasonCode: "account_not_allowed" });
      else logFunnelEvent("signin_completed", { source: viaEmailCode ? "email_code" : "google" });
      return allowed;
    }
  }
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
