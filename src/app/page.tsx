import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { getRecommendations } from "@/features/recommendations/api";
import { SessionControls } from "@/features/study-sessions/session-controls";
import { studySessionRepository } from "@/features/study-sessions/api";
import { getOwnerId } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";

export const dynamic = "force-dynamic";

const kindLabel = { continue: "Continuar", review: "Revisar", mistake: "Corrigir erro", project: "Projeto" } as const;

export default async function HomePage() {
  const recommendations = await getRecommendations();
  const [primaryRecommendation, ...queue] = recommendations;
  const sessions = getDatabaseUrl() ? await studySessionRepository().list(await getOwnerId()) : [];
  const openSessions = sessions.filter(session => session.status === "ACTIVE" || session.status === "PLANNED");

  return (
    <AppShell>
      <div className="today">
        <header className="today-header">
          <p className="today-date">{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p>
          <h1>Hoje</h1>
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

        <section className="time-card" aria-labelledby="time-title">
          <h2 id="time-title">Quanto tempo você tem agora?</h2>
          <p>Montamos a sessão com revisões, erros pendentes e a próxima aula.</p>
          <SessionControls />
        </section>

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
            <FirstRunCallout description="Ainda não há aulas disponíveis. Assim que um conteúdo for liberado, ele aparece aqui." />
          )}
        </section>

        {queue.length > 0 && (
          <section className="today-queue" aria-labelledby="queue-title">
            <h2 id="queue-title">Depois disso</h2>
            <ol>
              {queue.map(recommendation => (
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
      </div>
    </AppShell>
  );
}
