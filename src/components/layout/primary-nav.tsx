"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Database,
  Download,
  FolderKanban,
  History,
  Map,
  Medal,
  MoreHorizontal,
  RotateCcw,
  TriangleAlert,
  Upload
} from "lucide-react";

const primaryNavigationItems = [
  { label: "Hoje", href: "/", icon: Database, match: ["/"] },
  { label: "Aprender", href: "/tracks", icon: BookOpen, match: ["/tracks", "/lessons", "/concepts"] },
  { label: "Progresso", href: "/progress", icon: ChartNoAxesColumnIncreasing, match: ["/progress"] }
];

const secondaryNavigationItems = [
  { label: "Revisar", href: "/review", icon: RotateCcw, match: ["/review"] },
  { label: "Avaliações", href: "/assessments", icon: BookOpen, match: ["/assessments"] },
  { label: "Importar", href: "/import", icon: Upload, match: ["/import"] },
  { label: "Histórico", href: "/history", icon: History, match: ["/history"] },
  { label: "Erros", href: "/mistakes", icon: TriangleAlert, match: ["/mistakes"] },
  { label: "Projetos", href: "/projects", icon: FolderKanban, match: ["/projects"] },
  { label: "Mapa", href: "/knowledge-map", icon: Map, match: ["/knowledge-map"] },
  { label: "Exports", href: "/exports", icon: Download, match: ["/exports"] },
  { label: "Badges", href: "/achievements", icon: Medal, match: ["/achievements"] }
];

function isCurrentRoute(pathname: string, matches: string[]) {
  return matches.some((match) => (match === "/" ? pathname === "/" : pathname.startsWith(match)));
}

export function PrimaryNav() {
  const pathname = usePathname() ?? "/";
  const hasSecondaryCurrent = secondaryNavigationItems.some((item) => isCurrentRoute(pathname, item.match));

  return (
    <>
      {primaryNavigationItems.map((item, index) => {
        const Icon = item.icon;
        const isCurrent = isCurrentRoute(pathname, item.match);

        return (
          <Link
            className={isCurrent ? "nav-current" : "nav-link"}
            href={item.href}
            aria-current={isCurrent ? "page" : undefined}
            key={item.href}
          >
            <span className="nav-index">{String(index + 1).padStart(2, "0")}</span>
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <details className={hasSecondaryCurrent ? "nav-more nav-more-current" : "nav-more"}>
        <summary>
          <MoreHorizontal aria-hidden="true" />
          <span>Mais</span>
        </summary>

        <div className="nav-more-panel">
          {secondaryNavigationItems.map((item) => {
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
        </div>
      </details>
    </>
  );
}
