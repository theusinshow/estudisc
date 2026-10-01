import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { getRecommendations } from "@/features/recommendations/api";
import { SessionControls } from "@/features/study-sessions/session-controls";
import { studySessionRepository } from "@/features/study-sessions/api";
import { getOwnerId } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recommendations = await getRecommendations();
  const primaryRecommendation = recommendations[0];
  const sessions=getDatabaseUrl()?await studySessionRepository().list(await getOwnerId()):[];

  return (
    <AppShell>
      <section className="foundation-panel accent-panel accent-today" aria-labelledby="today-title">
        <p className="eyebrow">Today</p>
        <h1 id="today-title">Próxima ação</h1>
        <SessionControls />
        {sessions.filter(session=>session.status==="ACTIVE"||session.status==="PLANNED").map(session=><p key={session.id}><Link href={`/study/${session.id}`}>Retomar sessão de {session.budgetMinutes} min</Link></p>)}
        <p>A ordem é determinística: revisão vencida, erro ativo, continuidade do catálogo e aplicação em projeto.</p>

        {primaryRecommendation ? (
          <Link className="today-action" href={primaryRecommendation.href}>
            <strong>{primaryRecommendation.title}</strong>
            <span>{primaryRecommendation.reason}</span>
          </Link>
        ) : (
          <FirstRunCallout description="Ainda não existe catálogo local para calcular a próxima aula, revisão ou prática." />
        )}

        <section className="module-section" aria-labelledby="recommendations-title">
          <h2 id="recommendations-title">Recomendações</h2>
          {recommendations.length === 0 ? (
            <p className="lesson-text">As recomendações aparecem depois que uma aula for ativada.</p>
          ) : (
            <ol className="record-list" aria-label="Recomendações determinísticas">
              {recommendations.map((recommendation) => (
                <li key={recommendation.id}>
                  <Link href={recommendation.href}>
                    <strong>{recommendation.title}</strong>
                    <span>{recommendation.reason}</span>
                    <small>{recommendation.kind}</small>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <dl className="foundation-list" aria-label="Estado da fundação">
          <div>
            <dt>Fonte</dt>
            <dd>Regras locais sem dependência de IA.</dd>
          </div>
          <div>
            <dt>Prioridade</dt>
            <dd>Review, erros, continuidade, projetos.</dd>
          </div>
          <div>
            <dt>Validação</dt>
            <dd>Recomendações derivadas de evidência e catálogo.</dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}
