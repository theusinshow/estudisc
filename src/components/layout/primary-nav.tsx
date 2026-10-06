"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft, BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, ClipboardCheck,
  Database, Download, FolderKanban, History, LogOut, Map, Medal,
  MoreHorizontal, RotateCcw, Sun, TriangleAlert, Upload, UserRound
} from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Sheet } from "@/components/ui/dialog";

const home = { label: "Hoje", href: "/", icon: Sun, match: ["/"] };
const learn = { label: "Aprender", href: "/tracks", icon: BookOpen, match: ["/tracks", "/lessons", "/concepts"] };
const progress = { label: "Progresso", href: "/progress", icon: ChartNoAxesColumnIncreasing, match: ["/progress"] };
const review = { label: "Revisar", href: "/review", icon: RotateCcw, match: ["/review"] };
const plan = { label: "Plano", href: "/plan", icon: CalendarDays, match: ["/plan", "/study"] };
const secondaryNavigationItems = [
  review,
  { label: "Simulados", href: "/assessments", icon: BookOpen, match: ["/assessments"] },
  { label: "Importar", href: "/import", icon: Upload, match: ["/import"], adminOnly: true },
  { label: "Revisar aulas", href: "/admin/review", icon: ClipboardCheck, match: ["/admin/review"], adminOnly: true },
  { label: "Administração", href: "/admin", icon: Database, match: ["/admin"], adminOnly: true },
  { label: "Histórico", href: "/history", icon: History, match: ["/history"] },
  { label: "Erros", href: "/mistakes", icon: TriangleAlert, match: ["/mistakes"] },
  { label: "Projetos", href: "/projects", icon: FolderKanban, match: ["/projects"], adminOnly: true },
  { label: "Mapa", href: "/knowledge-map", icon: Map, match: ["/knowledge-map"] },
  { label: "Exportar", href: "/exports", icon: Download, match: ["/exports"], adminOnly: true },
  { label: "Conquistas", href: "/achievements", icon: Medal, match: ["/achievements"] }
];
const profileSchema = z.object({ role: z.enum(["ADMIN", "STUDENT"]).optional(), name: z.string().nullable().optional(), accountMode: z.boolean().optional() });
type Profile = z.infer<typeof profileSchema>;

function isCurrentRoute(pathname: string, matches: string[]) {
  return matches.some(match => match === "/" ? pathname === "/" : pathname.startsWith(match));
}

/** One profile read serves the topbar and navigation. Focus has no global navigation. */
export function ShellNavigation({ studyNavigation, focus, exit }: Readonly<{
  studyNavigation: boolean;
  focus: boolean;
  exit?: Readonly<{ href: string; label: string }>;
}>) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  useEffect(() => {
    if (focus) return;
    const controller = new AbortController();
    void fetch("/api/profile", { signal: controller.signal })
      .then(async response => response.ok ? profileSchema.safeParse(await response.json()) : null)
      .then(result => { if (result?.success) setProfile(result.data); }).catch(() => {});
    return () => controller.abort();
  }, [focus]);

  async function signOut() {
    await fetch("/api/session", { method: "DELETE" }).catch(() => {});
    window.location.replace(new URL("/auth/signin", window.location.origin).href);
  }

  const primaryItems = studyNavigation ? [home, plan, learn, review, progress] : [home, learn, progress];
  const secondaryItems = secondaryNavigationItems.filter(item =>
    (!("adminOnly" in item) || profile?.role === "ADMIN") && (!studyNavigation || item.href !== review.href)
  );
  const hasSecondaryCurrent = secondaryItems.some(item => isCurrentRoute(pathname, item.match));
  const secondaryLinks = <>
    {secondaryItems.map(item => {
      const Icon = item.icon;
      const current = isCurrentRoute(pathname, item.match);
      return <Link className={current ? "nav-current" : "nav-link"} href={item.href}
        aria-current={current ? "page" : undefined} key={item.href} onClick={() => setMenuOpen(false)}>
        <Icon aria-hidden="true" /><span>{item.label}</span>
      </Link>;
    })}
    {profile?.accountMode && <div className="nav-account">
      <span>Conectado como <strong>{profile.name}</strong></span>
      <button type="button" className="nav-link" onClick={() => void signOut()}><LogOut aria-hidden="true" /><span>Sair</span></button>
    </div>}
  </>;

  return <>
    <header className="topbar">
      <Link className="brand-link" href="/" aria-label="Estudisc, página inicial"><BrandLockup /></Link>
      {focus && exit ? <Link className="focus-exit" href={exit.href}><ArrowLeft aria-hidden="true" />{exit.label}</Link>
        : studyNavigation && <button className="account-menu-trigger" type="button" aria-label="Abrir perfil e outras páginas"
          aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><UserRound aria-hidden="true" /></button>}
    </header>
    {!focus && <nav className="sidebar" data-navigation={studyNavigation ? "study" : "legacy"} aria-label="Navegação principal">
      {primaryItems.map(item => {
        const Icon = item.icon;
        const current = isCurrentRoute(pathname, item.match);
        return <Link className={current ? "nav-current" : "nav-link"} href={item.href}
          aria-current={current ? "page" : undefined} key={item.href}>
          <span className="nav-icon"><Icon aria-hidden="true" /></span><span>{item.label}</span>
        </Link>;
      })}
      {!studyNavigation && <details className={hasSecondaryCurrent ? "nav-more nav-more-current" : "nav-more"}>
        <summary><span className="nav-icon"><MoreHorizontal aria-hidden="true" /></span><span>Mais</span></summary>
        <div className="nav-more-panel">{secondaryLinks}</div>
      </details>}
    </nav>}
    {!focus && studyNavigation && <Sheet open={menuOpen} title="Perfil e outras páginas" onClose={() => setMenuOpen(false)}>
      <nav className="secondary-navigation" aria-label="Outras páginas">{secondaryLinks}</nav>
    </Sheet>}
  </>;
}
