import type { ReactNode } from "react";
import { ShellNavigation, type ShellProfile } from "@/components/layout/primary-nav";
import { getAccountConfig } from "@/features/auth/account-mode";
import { getOwnerProfile } from "@/features/auth/owner";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getServerEnv } from "@/lib/env";

// Resolved per request on the server: the navigation needs no client profile fetch or response validation.
// Hiding admin links is presentation only; every admin route and API still enforces the role itself.
async function readShellProfile(): Promise<ShellProfile | null> {
  try {
    const profile = await getOwnerProfile();
    return { role: profile.role, name: profile.name ?? null, accountMode: Boolean(getAccountConfig(getServerEnv()) || profile.email) };
  } catch {
    return null;
  }
}

export async function AppShell({ children, mode = "page", exit }: Readonly<{
  children: ReactNode;
  mode?: "page" | "focus";
  exit?: Readonly<{ href: string; label: string }>;
}>) {
  const studyNavigation = getFeatureFlags().FEATURE_STUDY_PLANNER;
  const focus = mode === "focus";
  const profile = focus ? null : await readShellProfile();
  return (
    <div className="app-shell" data-mode={mode}>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo principal
      </a>

      <ShellNavigation studyNavigation={studyNavigation} focus={focus} profile={profile} exit={focus ? exit ?? { href: "/", label: "Voltar para Hoje" } : undefined} />

      <main id="main-content" className="main-surface" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
