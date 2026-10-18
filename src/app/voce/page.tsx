import Link from "next/link";
import {
  ChartNoAxesColumnIncreasing, ChevronRight, ClipboardCheck, Database, Download, FolderKanban,
  History, LifeBuoy, Map, Medal, Palette, RotateCcw, TriangleAlert, Upload, UserRound
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { getAccountConfig } from "@/features/auth/account-mode";
import { getOwnerProfile } from "@/features/auth/owner";
import { SignOutButton } from "@/features/navigation/sign-out-button";
import { getProgressOverview } from "@/features/progress/api";
import { buildWeeklyRecap } from "@/features/progress/weekly-recap";
import { WeeklyRecapStories } from "@/features/progress/weekly-recap-stories";
import { daysUntilExam } from "@/features/public-site/countdown";
import { StudyPreferencesPanel } from "@/features/study-tools/study-preferences-panel";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type HubLink = Readonly<{ href: string; label: string; detail: string; icon: typeof Map }>;

const PROGRESS: HubLink[] = [
  { href: "/progress", label: "Progresso", detail: "Domínio por matéria e conceito", icon: ChartNoAxesColumnIncreasing },
  { href: "/achievements", label: "Conquistas", detail: "O que você já alcançou", icon: Medal },
  { href: "/knowledge-map", label: "Mapa de conceitos", detail: "Como os assuntos se ligam", icon: Map },
  { href: "/history", label: "Histórico", detail: "Sessões e respostas anteriores", icon: History }
];
const STUDY: HubLink[] = [
  { href: "/review", label: "Revisão", detail: "O que voltou para revisar", icon: RotateCcw },
  { href: "/mistakes", label: "Erros", detail: "Questões para refazer", icon: TriangleAlert }
];
const ADMIN: HubLink[] = [
  { href: "/admin", label: "Administração", detail: "Usuários e conteúdo", icon: Database },
  { href: "/admin/review", label: "Revisar aulas", detail: "Revisão editorial", icon: ClipboardCheck },
  { href: "/admin/lab", label: "Lab de design", detail: "Catálogo do Design System", icon: Palette },
  { href: "/import", label: "Importar", detail: "Packs de conteúdo", icon: Upload },
  { href: "/projects", label: "Projetos", detail: "Projetos de código", icon: FolderKanban },
  { href: "/exports", label: "Exportar", detail: "Backup dos seus dados", icon: Download }
];

function Section({ title, links }: Readonly<{ title: string; links: readonly HubLink[] }>) {
  return (
    <section className="hub-section" aria-label={title}>
      <h2 className="type-meta">{title}</h2>
      <ul className="hub-list">
        {links.map(({ href, label, detail, icon: Icon }) => (
          <li key={href}>
            <Link className="hub-link" href={href}><Icon aria-hidden="true" /><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight className="hub-chevron" aria-hidden="true" /></Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Você" tab: progress, study tools, account and (for ADMIN) administration in one mobile list. */
export default async function YouPage() {
  const profile = await getOwnerProfile().catch(() => null);
  const accountMode = Boolean(getAccountConfig(getServerEnv()));
  const name = profile?.name ?? (profile?.role === "ADMIN" ? "Administrador" : "Estudante");
  const overview = profile ? await getProgressOverview().catch(() => null) : null;
  const recap = overview ? buildWeeklyRecap(overview, daysUntilExam()) : [];
  return (
    <AppShell>
      <section className="hub" aria-labelledby="voce-title">
        <header className="hub-profile">
          <span className="hub-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
          <div><p className="eyebrow">Você</p><h1 id="voce-title">{name}</h1></div>
        </header>
        {recap.length > 0 ? <section className="hub-section" aria-label="Resumo da semana"><h2 className="type-meta">Resumo da semana</h2><WeeklyRecapStories stories={recap} /></section> : null}
        <Section title="Seu progresso" links={PROGRESS} />
        <Section title="Para estudar" links={STUDY} />
        <section className="hub-section" aria-label="Preferências de estudo">
          <h2 className="type-meta">Preferências de estudo</h2>
          <StudyPreferencesPanel />
        </section>
        <section className="hub-section" aria-label="Conta">
          <h2 className="type-meta">Conta</h2>
          <ul className="hub-list">
            {accountMode ? <li><Link className="hub-link" href="/conta"><UserRound aria-hidden="true" /><span><strong>Minha conta</strong><small>E-mail, login e dados</small></span><ChevronRight className="hub-chevron" aria-hidden="true" /></Link></li> : null}
            <li><Link className="hub-link" href="/suporte"><LifeBuoy aria-hidden="true" /><span><strong>Suporte</strong><small>Dúvidas e ajuda</small></span><ChevronRight className="hub-chevron" aria-hidden="true" /></Link></li>
            <li><SignOutButton /></li>
          </ul>
        </section>
        {profile?.role === "ADMIN" ? <Section title="Administração" links={ADMIN} /> : null}
      </section>
    </AppShell>
  );
}
