import Link from "next/link";
import { ArrowRight } from "lucide-react";

import "@/styles/today.css";
import { AppShell } from "@/components/layout/app-shell";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { WeekStrip } from "@/features/progress/week-strip";
import { getTodayDashboard } from "@/features/today/get-today-dashboard";
import { getFeatureFlags } from "@/lib/feature-flags";
import { resolveAccessState } from "@/features/payments/access-guard";
import { FreePreviewHome } from "@/features/payments/free-preview-home";
import { logFunnelEvent } from "@/lib/funnel-events";
import { TodayPage } from "@/features/today/today-page";
import { formatTodayDate } from "@/features/today/today-date";

export const dynamic = "force-dynamic";

const kindLabel = { continue: "Continuar", review: "Revisar", mistake: "Corrigir erro", project: "Projeto" } as const;

export default async function HomePage() {
  // Free preview (ADR 0061): show what the account can open instead of sessions that need full access.
  if (!(await resolveAccessState()).hasFullAccess) {
    logFunnelEvent("free_home_viewed");
    return <AppShell><FreePreviewHome /></AppShell>;
  }
  const dashboard = await getTodayDashboard();
  if (getFeatureFlags().FEATURE_NEW_TODAY) return <TodayPage dashboard={dashboard} />;
  const primaryRecommendation = dashboard.nextAction;
  const queue = dashboard.queue;
  const overview = dashboard.progress;
  const dueReviews = dashboard.dueReviews;
  const mistakes = dashboard.mistakes;
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
          <p className="today-date">{formatTodayDate()}</p>
          <h1>Hoje</h1>
          <ul className="today-pulse" aria-label="Resumo de hoje">
            {pulse.map(item => (
              <li key={item.href}>
                <Link href={item.href} data-pulse={item.kind} data-zero={item.count === 0 || undefined}>
                  <strong>{item.count}</strong> <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </header>

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
              {queue.map((recommendation) => (
                <li key={recommendation.id}>
                  <Link href={recommendation.href} data-kind={recommendation.kind}>
                    <span className="kind-dot" aria-hidden="true" />
                    <span>
                      <strong>{recommendation.title}</strong>
                      <small>{kindLabel[recommendation.kind]} · {recommendation.reason}</small>
                    </span>
                  </Link>
                </li>
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
              ? "Nenhum dia com estudo ainda nesta semana. Responder uma questão já marca o dia."
              : overview.activeDaysThisWeek === 1 ? "1 dia com estudo nesta semana." : `${overview.activeDaysThisWeek} dias com estudo nesta semana.`}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
