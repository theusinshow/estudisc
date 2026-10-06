import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { WeekStrip } from "@/features/progress/week-strip";
import { getFeatureFlags } from "@/lib/feature-flags";
import { StudyActionCard } from "./study-action-card";
import { TodayPlan } from "./today-plan";
import type { getTodayDashboard } from "./get-today-dashboard";

type Dashboard = Awaited<ReturnType<typeof getTodayDashboard>>;

export function TodayPage({ dashboard }: Readonly<{ dashboard: Dashboard }>) {
  const next = dashboard.nextAction;
  const activeMistakes = dashboard.mistakes.filter(mistake => mistake.status === "active").length;
  const session = next?.id.startsWith("session:") ? dashboard.sessions.find(row => `session:${row.id}` === next.id) : undefined;
  const overview = dashboard.progress;
  return <AppShell><div className="today today-evolution">
    <header className="today-header">
      <p className="today-date">{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date())}</p>
      <h1>Hoje</h1>
    </header>
    <section className="today-next" aria-labelledby="next-title">
      <h2 id="next-title">Próxima ação</h2>
      {next ? <StudyActionCard variant={next.kind === "mistake" ? "practice" : next.kind}
        title={next.title} reason={next.reason} href={next.href} estimatedMinutes={session?.budgetMinutes} /> : <FirstRunCallout />}
    </section>
    <TodayPlan sessions={dashboard.sessions} hasNextAction={Boolean(next)} plannerEnabled={getFeatureFlags().FEATURE_STUDY_PLANNER} />
    {(dashboard.dueReviews.length > 0 || activeMistakes > 0) && <section className="today-attention" aria-labelledby="attention-title">
      <h2 id="attention-title">Precisa da sua atenção</h2>
      <ul>
        {dashboard.dueReviews.length > 0 && <li><Link href="/review">{dashboard.dueReviews.length} {dashboard.dueReviews.length === 1 ? "conceito para revisar" : "conceitos para revisar"}<ArrowRight aria-hidden="true" /></Link></li>}
        {activeMistakes > 0 && <li><Link href="/mistakes">{activeMistakes} {activeMistakes === 1 ? "erro para retomar" : "erros para retomar"}<ArrowRight aria-hidden="true" /></Link></li>}
      </ul>
    </section>}
    {dashboard.queue.length > 0 && <section className="today-queue" aria-labelledby="queue-title">
      <h2 id="queue-title">Depois disso</h2><ol>{dashboard.queue.map(action => <li key={action.id}>
        <Link href={action.href} data-kind={action.kind}><span><strong>{action.title}</strong><small>{action.reason}</small></span></Link>
      </li>)}</ol>
    </section>}
    <section className="today-week" aria-labelledby="week-title">
      <div className="today-week-head"><h2 id="week-title">Sua semana</h2><Link href="/progress">Ver progresso<ArrowRight aria-hidden="true" /></Link></div>
      <WeekStrip days={overview.week} />
      <p>{overview.activeDaysThisWeek === 0 ? "Nenhum dia com estudo ainda nesta semana. Uma sessão curta já marca o dia."
        : `${overview.activeDaysThisWeek} ${overview.activeDaysThisWeek === 1 ? "dia com estudo" : "dias com estudo"} nesta semana.`}</p>
    </section>
  </div></AppShell>;
}
