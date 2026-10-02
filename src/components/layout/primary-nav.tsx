"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect,useState } from "react";
import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Database,
  Download,
  FolderKanban,
  History,
  LogOut,
  Map,
  Medal,
  MoreHorizontal,
  RotateCcw,
  TriangleAlert,
  Sun,
  Upload
} from "lucide-react";

const primaryNavigationItems = [
  { label: "Hoje", href: "/", icon: Sun, match: ["/"] },
  { label: "Aprender", href: "/tracks", icon: BookOpen, match: ["/tracks", "/lessons", "/concepts"] },
  { label: "Progresso", href: "/progress", icon: ChartNoAxesColumnIncreasing, match: ["/progress"] }
];

const secondaryNavigationItems = [
  { label: "Revisar", href: "/review", icon: RotateCcw, match: ["/review"] },
  { label: "Simulados", href: "/assessments", icon: BookOpen, match: ["/assessments"] },
  { label: "Importar", href: "/import", icon: Upload, match: ["/import"],adminOnly:true },
  { label: "Administração", href: "/admin", icon: Database, match: ["/admin"],adminOnly:true },
  { label: "Histórico", href: "/history", icon: History, match: ["/history"] },
  { label: "Erros", href: "/mistakes", icon: TriangleAlert, match: ["/mistakes"] },
  { label: "Projetos", href: "/projects", icon: FolderKanban, match: ["/projects"],adminOnly:true },
  { label: "Mapa", href: "/knowledge-map", icon: Map, match: ["/knowledge-map"] },
  { label: "Exportar dados", href: "/exports", icon: Download, match: ["/exports"],adminOnly:true },
  { label: "Conquistas", href: "/achievements", icon: Medal, match: ["/achievements"] }
];

function isCurrentRoute(pathname: string, matches: string[]) {
  return matches.some((match) => (match === "/" ? pathname === "/" : pathname.startsWith(match)));
}

export function PrimaryNav() {
  const [profile,setProfile]=useState<{role?:string;name?:string|null;accountMode?:boolean}|null>(null);
  useEffect(()=>{const controller=new AbortController();void fetch("/api/profile",{signal:controller.signal}).then(response=>response.ok?response.json():null).then(setProfile).catch(()=>{});return ()=>controller.abort();},[]);
  const isAdmin=profile?.role==="ADMIN";
  // A full reload after sign-out drops every client cache of the previous account.
  async function signOut(){await fetch("/api/session",{method:"DELETE"}).catch(()=>{});window.location.replace(new URL("/auth/signin",window.location.origin).href);}
  const secondaryItems=secondaryNavigationItems.filter(item=>!("adminOnly" in item)||isAdmin);
  const pathname = usePathname() ?? "/";
  const hasSecondaryCurrent = secondaryItems.some((item) => isCurrentRoute(pathname, item.match));

  return (
    <>
      {primaryNavigationItems.map((item) => {
        const Icon = item.icon;
        const isCurrent = isCurrentRoute(pathname, item.match);

        return (
          <Link
            className={isCurrent ? "nav-current" : "nav-link"}
            href={item.href}
            aria-current={isCurrent ? "page" : undefined}
            key={item.href}
          >
            <span className="nav-icon"><Icon aria-hidden="true" /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      <details className={hasSecondaryCurrent ? "nav-more nav-more-current" : "nav-more"}>
        <summary>
          <span className="nav-icon"><MoreHorizontal aria-hidden="true" /></span>
          <span>Mais</span>
        </summary>

        <div className="nav-more-panel">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = isCurrentRoute(pathname, item.match);

            return (
              <Link
                className={isCurrent ? "nav-current" : "nav-link"}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                key={item.href}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {profile?.accountMode&&(
            <div className="nav-account">
              <span>Conectado como <strong>{profile.name}</strong></span>
              <button type="button" className="nav-link" onClick={()=>void signOut()}><LogOut aria-hidden="true" /><span>Sair</span></button>
            </div>
          )}
        </div>
      </details>
    </>
  );
}
