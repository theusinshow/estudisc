import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { isAllowedGoogleEmail, isGoogleAuthConfigured } from "@/features/auth/auth-readiness";
import { googleAuthorizationParams } from "@/features/auth/google-oauth";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";
import { logFunnelEvent } from "@/lib/funnel-events";

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
    async signIn({ profile }) {
      if (!googleAuthConfigured) {
        logEvent("warn", "auth_failure", { reasonCode: "provider_not_configured" });
        return false;
      }

      const allowed = isAllowedGoogleEmail(profile?.email, env);
      // ADR 0068: a Google e-mail linked to an account (e.g. a code profile) lands on that ownerId.
      const linked = await startGoogleAccountSession(profile?.email, profile?.name, allowed).catch(() => {
        logEvent("warn", "google_account_session_failed", {});
        return false;
      });
      if (!allowed && !linked) logEvent("warn", "auth_failure", { reasonCode: "account_not_allowed" });
      else logFunnelEvent("signin_completed", { source: "google" });
      return allowed || linked;
    }
  }
} satisfies NextAuthConfig;

/** Issues the ADR 0068 account session for a Google sign-in; true when the e-mail belongs to a linked account. */
async function startGoogleAccountSession(email: string | null | undefined, name: string | null | undefined, allowed: boolean) {
  if (!email || !env.AUTH_SECRET) return false;
  const normalized = email.trim().toLowerCase();
  const [{ getAccountStore }, { profileForEmail }, { createUserSession, USER_SESSION_COOKIE, userSessionCookieOptions }, { cookies }] = await Promise.all([
    import("@/features/auth/accounts"), import("@/features/auth/owner"), import("@/features/auth/user-session"), import("next/headers")
  ]);
  const store = getAccountStore();
  const linked = await store.findByIdentity("email", normalized) ?? await store.findByIdentity("google", normalized);
  const account = linked ?? (allowed ? await googleAccount(store, profileForEmail(normalized, env), name, normalized) : null);
  if (!account || account.status !== "active") return false;
  (await cookies()).set(USER_SESSION_COOKIE, createUserSession(account, env.AUTH_SECRET), userSessionCookieOptions(process.env.NODE_ENV === "production"));
  return Boolean(linked);
}

async function googleAccount(store: import("@/db/repositories/account-repository").AccountStore, profile: { ownerId: string; role: "ADMIN" | "STUDENT" }, name: string | null | undefined, email: string) {
  return store.ensureGoogleAccount({ id: profile.ownerId, role: profile.role, email, name: name?.trim() || email.split("@")[0] });
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
