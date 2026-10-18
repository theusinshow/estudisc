import type { ReactNode } from "react";
import { ShellNavigation } from "@/components/layout/primary-nav";

/** Mobile-first shell: top brand bar plus the bottom tab bar (sidebar on wide screens). */
export function AppShell({ children, mode = "page", exit }: Readonly<{
  children: ReactNode;
  mode?: "page" | "focus";
  exit?: Readonly<{ href: string; label: string; short?: string }>;
}>) {
  const focus = mode === "focus";
  return (
    <div className="app-shell" data-mode={mode}>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo principal
      </a>

      <ShellNavigation focus={focus} exit={focus ? exit ?? { href: "/", label: "Voltar para Hoje" } : undefined} />

      <main id="main-content" className="main-surface" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
