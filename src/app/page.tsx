import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

import "@/styles/today.css";
import { AppShell } from "@/components/layout/app-shell";
import { ClickSpark } from "@/components/motion/click-spark";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { WeekStrip } from "@/features/progress/week-strip";
import { getTodayDashboard } from "@/features/today/get-today-dashboard";
import { SessionControls } from "@/features/study-sessions/session-controls";
import { getFeatureFlags } from "@/lib/feature-flags";
import { TodayPage } from "@/features/today/today-page";
import { remainingRoutineMinutes } from "@/features/study-sessions/routine-session-constraints";
import { formatTodayDate } from "@/features/today/today-date";

export const dynamic = "force-dynamic";

const kindLabel = { continue: "Continuar", review: "Revisar", mistake: "Corrigir erro", project: "Projeto" } as const;

export default async function HomePage() {
  const dashboard = await getTodayDashboard();
  if (getFeatureFlags().FEATURE_NEW_TODAY) return <TodayPage dashboard={dashboard} />;
  const primaryRecommendation = dashboard.nextAction;
  const queue = dashboard.queue;
  const overview = dashboard.progress;
  const dueReviews = dashboard.dueReviews;
  const mistakes = dashboard.mistakes;
  const openSessions = dashboard.sessions.filter(session => session.status === "ACTIVE" || session.status === "PLANNED");
  const activeMistakes = mistakes.filter(mistake => mistake.status === "active").length;
  const pulse = [
    { href: "/review", kind: "review", count: dueReviews.length, label: dueReviews.length === 1 ? "revisão para hoje" : "revisões para hoje" },
    { href: "/mistakes", kind: "mistake", count: activeMistakes, label: activeMistakes === 1 ? "erro para corrigir" : "erros para corrigir" },
    { href: "/progress", kind: "progress", count: overview.practicingOrAbove, label: overview.practicingOrAbove === 1 ? "conceito em prática ou acima" : "conceitos em prática ou acima" }
  ];

  return (
    <AppShell>
      <div className="today">
        <header className="today-header">
          <p className="today-date">{formatTodayDate(dashboard.routine?.week?.today)}</p>
          <h1>Hoje</h1>
          <ul className="today-pulse" aria-label="Resumo de hoje">
            {pulse.map(item => (
              <li key={item.href}>
                <Link href={item.href} data-pulse={item.kind} data-zero={item.count === 0 || undefined}>
                  <CountUp value={item.count} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </header>

        {openSessions.map(session => (
          <Link className="resume-card" href={`/study/${session.id}`} key={session.id}>
            <span className="resume-icon"><Play aria-hidden="true" /></span>
            <span>
              <strong>Continuar de onde parou</strong>
              <small>Sessão de {session.budgetMinutes} min</small>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}

        {/* Without anything to study, the session buttons could only fail; the callout below explains instead. */}
        {primaryRecommendation && <section className="time-card" aria-labelledby="time-title">
          <h2 id="time-title">Quanto tempo você tem agora?</h2>
          <p>Montamos a sessão com revisões, erros pendentes e a próxima aula.</p>
          <ClickSpark>
            <SessionControls adaptive={getFeatureFlags().FEATURE_ADAPTIVE_SESSION} availableMinutes={dashboard.routine?.week?.activeSessionId ? undefined : remainingRoutineMinutes(dashboard.routine?.week ?? null)} />
          </ClickSpark>
        </section>}

        <section className="today-next" aria-labelledby="next-title">
          <h2 id="next-title">Próxima ação</h2>
          {primaryRecommendation ? (
            <Link className="next-card" data-kind={primaryRecommendation.kind} href={primaryRecommendation.href}>
              <span className="kind-chip">{kindLabel[primaryRecommendation.kind]}</span>
              <strong>{primaryRecommendation.title}</strong>
              <span>{primaryRecommendation.reason}</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <FirstRunCallout />
          )}
        </section>

        {queue.length > 0 && (
          <section className="today-queue" aria-labelledby="queue-title">
            <h2 id="queue-title">Depois disso</h2>
            <ol>
              {queue.map((recommendation, index) => (
                <Reveal as="li" index={index} key={recommendation.id}>
                  <Link href={recommendation.href} data-kind={recommendation.kind}>
                    <span className="kind-dot" aria-hidden="true" />
                    <span>
                      <strong>{recommendation.title}</strong>
                      <small>{kindLabel[recommendation.kind]} · {recommendation.reason}</small>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ol>
          </section>
        )}

        <section className="today-week" aria-labelledby="week-title">
          <div className="today-week-head">
            <h2 id="week-title">Sua semana</h2>
            <Link href="/progress">Ver progresso <ArrowRight aria-hidden="true" /></Link>
          </div>
          <WeekStrip days={overview.week} />
          <p>
            {overview.activeDaysThisWeek === 0
              ? "Nenhum dia com estudo ainda nesta semana. Uma sessão curta já marca o dia."
              : overview.activeDaysThisWeek === 1 ? "1 dia com estudo nesta semana." : `${overview.activeDaysThisWeek} dias com estudo nesta semana.`}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
