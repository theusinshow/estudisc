import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { isAllowedGoogleEmail, isGoogleAuthConfigured } from "@/features/auth/auth-readiness";
import { googleAuthorizationParams } from "@/features/auth/google-oauth";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";

const env = getServerEnv();
const googleAuthConfigured = isGoogleAuthConfigured(env);

export const authConfig = {
  providers: googleAuthConfigured
    ? [
        Google({
          authorization: {
            params: googleAuthorizationParams
          }
        })
      ]
    : [],
  secret: env.AUTH_SECRET,
  trustHost: env.AUTH_TRUST_HOST ?? Boolean(process.env.VERCEL),
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  callbacks: {
    signIn({ profile }) {
      if (!googleAuthConfigured) {
        logEvent("warn", "auth_failure", { reasonCode: "provider_not_configured" });
        return false;
      }

      const allowed = isAllowedGoogleEmail(profile?.email, env);
      if (!allowed) logEvent("warn", "auth_failure", { reasonCode: "account_not_allowed" });
      return allowed;
    }
  }
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
