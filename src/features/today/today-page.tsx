import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WeekStrip } from "@/features/progress/week-strip";
import type { getTodayDashboard } from "./get-today-dashboard";
import { formatTodayDate } from "./today-date";
import { ContinueStudy } from "@/features/study-flow/continue-study";
import { GoalTower } from "./goal-tower";

type Dashboard = Awaited<ReturnType<typeof getTodayDashboard>>;

export function TodayPage({ dashboard }: Readonly<{ dashboard: Dashboard }>) {
  const activeMistakes = dashboard.mistakes.filter(mistake => mistake.status === "active").length;
  // One count for Today and /review: Concepts due by schedule or with an active mistake.
  const toReview = dashboard.dueReviews.length;
  const withMistakes = dashboard.dueReviews.filter(review => review.hasActiveMistake).length;
  const overview = dashboard.progress;
  return <AppShell><div className="today today-evolution">
    <header className="today-header">
      <p className="today-date">{formatTodayDate()}</p>
      <h1>Hoje</h1>
    </header>
    {/* ADR 0060 / 0072: Today offers the continuous lesson flow; review and mistakes are practised in blocks on their pages. */}
    <ContinueStudy next={dashboard.flow.next} bySubject={dashboard.flow.bySubject} />
    {(toReview > 0 || activeMistakes > 0) && <section className="today-attention" aria-labelledby="attention-title">
      <h2 id="attention-title">Precisa da sua atenção</h2>
      <ul>
        {toReview > 0 && <li><Link href="/review">{toReview} {toReview === 1 ? "conceito para revisar" : "conceitos para revisar"}{withMistakes > 0 ? ` (${withMistakes} com erro)` : ""}<ArrowRight aria-hidden="true" /></Link></li>}
        {activeMistakes > 0 && <li><Link href="/mistakes">Ver meus erros<ArrowRight aria-hidden="true" /></Link></li>}
      </ul>
    </section>}
    <GoalTower answered={overview.week.find(day => day.isToday)?.count ?? 0} />
    <section className="today-week" aria-labelledby="week-title">
      <div className="today-week-head"><h2 id="week-title">Sua semana</h2><Link href="/progress">Ver progresso<ArrowRight aria-hidden="true" /></Link></div>
      <WeekStrip days={overview.week} />
      <p>{overview.activeDaysThisWeek === 0 ? "Nenhum dia com estudo ainda nesta semana. Responder uma questão já marca o dia."
        : `${overview.activeDaysThisWeek} ${overview.activeDaysThisWeek === 1 ? "dia com estudo" : "dias com estudo"} nesta semana.`}</p>
    </section>
  </div></AppShell>;
}
