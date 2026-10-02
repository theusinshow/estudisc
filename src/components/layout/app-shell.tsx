import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { PrimaryNav } from "@/components/layout/primary-nav";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo principal
      </a>

      <header className="topbar">
        <Link className="brand-link" href="/" aria-label="Vecta, página inicial">
          <BrandLockup />
        </Link>
      </header>

      <nav className="sidebar" aria-label="Navegação principal">
        <PrimaryNav />
      </nav>

      <main id="main-content" className="main-surface" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
