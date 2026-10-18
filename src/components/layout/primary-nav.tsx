"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, Play, Sun, UserRound } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";

/** Mobile-first: four tabs around one central "Continuar" action (owner decision, 2026-10-17). */
const tabs = [
  { label: "Hoje", href: "/", icon: Sun, match: ["/"] },
  { label: "Estudar", href: "/tracks", icon: BookOpen, match: ["/tracks", "/lessons", "/concepts", "/knowledge-map", "/review", "/mistakes", "/plan", "/study"] },
  { label: "Provas", href: "/provas", icon: FileText, match: ["/provas", "/assessments", "/past-exams"] },
  { label: "Você", href: "/voce", icon: UserRound, match: ["/voce", "/progress", "/achievements", "/history", "/conta", "/suporte", "/admin", "/import", "/projects", "/exports"] }
] as const;

/** Resolved on the server by AppShell for the current request; never cached across owners. */
export type ShellProfile = Readonly<{ role: "ADMIN" | "STUDENT"; name: string | null; accountMode: boolean }>;

function isCurrentRoute(pathname: string, matches: readonly string[]) {
  return matches.some(match => match === "/" ? pathname === "/" : pathname.startsWith(match));
}

function Tab({ tab, pathname }: Readonly<{ tab: (typeof tabs)[number]; pathname: string }>) {
  const Icon = tab.icon;
  const current = isCurrentRoute(pathname, tab.match);
  return <Link className={current ? "nav-current" : "nav-link"} href={tab.href} aria-current={current ? "page" : undefined}>
    <span className="nav-icon"><Icon aria-hidden="true" /></span><span className="nav-label">{tab.label}</span>
  </Link>;
}

/** One server profile read serves the shell. Focus mode has no global navigation, only an exit. */
export function ShellNavigation({ focus, exit }: Readonly<{
  studyNavigation?: boolean;
  focus: boolean;
  exit?: Readonly<{ href: string; label: string; short?: string }>;
  profile?: ShellProfile | null;
}>) {
  const pathname = usePathname() ?? "/";
  return <>
    <header className="topbar">
      <Link className="brand-link" href="/" aria-label="Estudisc, página inicial"><BrandLockup /></Link>
      {focus && exit ? <Link className="focus-exit" href={exit.href} aria-label={exit.short ? exit.label : undefined}><ArrowLeft aria-hidden="true" />{exit.short ?? exit.label}</Link> : null}
    </header>
    {!focus && <nav className="sidebar" data-navigation="tabs" aria-label="Navegação principal">
      <Tab tab={tabs[0]} pathname={pathname} />
      <Tab tab={tabs[1]} pathname={pathname} />
      {/* Plain link (no prefetch): the server decides the destination only when it is tapped. */}
      <a className="nav-continue" href="/continuar" aria-label="Continuar de onde parei">
        <span className="nav-continue-button"><Play aria-hidden="true" /></span><span className="nav-label">Continuar</span>
      </a>
      <Tab tab={tabs[2]} pathname={pathname} />
      <Tab tab={tabs[3]} pathname={pathname} />
    </nav>}
  </>;
}
