import Link from "next/link";
import { ArrowRight } from "lucide-react";

import "@/styles/progress.css";
import { AppShell } from "@/components/layout/app-shell";
import { CountUp } from "@/components/motion/count-up";
import { getXpSummary } from "@/features/gamification/api";
import { calculateRank } from "@/features/gamification/gamification-rules";
import { xpReasonLabel } from "@/features/gamification/study-rewards";
import { getDueReviews } from "@/features/review/api";
import { getProgressOverview } from "@/features/progress/api";
import { MasteryGlyph } from "@/features/progress/mastery-glyph";
import { MasteryLadder } from "@/features/progress/mastery-ladder";
import { masteryOrder } from "@/features/progress/overview";
import { AreaBalanceChart, RhythmChart } from "@/features/progress/progress-charts";
import { ReportCard, RhythmTable } from "@/features/progress/report-card";
import { studentConceptLabel } from "@/features/concepts/student-label";

export const dynamic = "force-dynamic";

const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export default async function ProgressPage() {
  const [overview, xp, dueReviews] = await Promise.all([getProgressOverview(), getXpSummary(), getDueReviews()]);
  const hasConcepts = overview.totalConcepts > 0;
  const hasEvidence = overview.conceptsWithEvidence > 0;
  const showBalance = overview.areas.length >= 3 && overview.areas.length <= 8;
  const rank = calculateRank(xp.totalXp);
  // The same numbers as Hoje: concepts queued for review, and how many of them come from a mistake.
  const withMistakes = dueReviews.filter((review) => review.hasActiveMistake).length;
  const next = withMistakes > 0
    ? { href: "/review", label: "Revisar meus erros" }
    : dueReviews.length > 0 ? { href: "/review", label: "Revisar agora" } : { href: "/tracks", label: "Continuar estudando" };

  return (
    <AppShell>
      <div className="progress-page">
        <header className="progress-head">
          <h1>Progresso</h1>
        </header>

        <section className="progress-stats" aria-label="Resumo">
          <div className="progress-stat">
            <span className="progress-stat-value"><CountUp value={overview.streakDays} /></span>
            <span className="progress-stat-label">{overview.streakDays === 1 ? "dia seguido" : "dias seguidos"}</span>
            <small>{overview.streakDays === 0 ? "Responda uma questão hoje para começar." : "Conta quem responde pelo menos uma questão no dia."}</small>
          </div>
          <div className="progress-stat">
            <span className="progress-stat-value"><CountUp value={xp.totalXp} /> XP</span>
            <span className="progress-stat-label">{rank.label}</span>
            {rank.nextRankAt !== null ? <>
              <progress value={rank.currentXp - rank.startsAt} max={rank.nextRankAt - rank.startsAt} aria-label={`Nível ${rank.label}`} />
              <small>Faltam {rank.nextRankAt - rank.currentXp} XP para {rank.nextLabel}.</small>
            </> : <small>Você chegou ao nível mais alto.</small>}
          </div>
          <div className="progress-stat">
            <span className="progress-stat-value"><CountUp value={withMistakes} /></span>
            <span className="progress-stat-label">{withMistakes === 1 ? "erro para revisar" : "erros para revisar"}</span>
            <small>{dueReviews.length === 0 ? "Nada para revisar agora." : `${plural(dueReviews.length, "conceito", "conceitos")} na revisão de hoje.`}</small>
          </div>
        </section>
        <nav className="progress-next" aria-label="Próximo passo">
          <Link href={next.href} className="primary-action">{next.label} <ArrowRight aria-hidden="true" /></Link>
          {next.href !== "/tracks" && <Link href="/tracks" className="effort-link">Continuar estudando <ArrowRight aria-hidden="true" /></Link>}
        </nav>

        <details className="progress-details">
          <summary>Ver detalhes do progresso</summary>
          <p className="progress-lede">
            {!hasConcepts
              ? "Assim que houver aulas liberadas, cada conceito aparece aqui no degrau em que está."
              : hasEvidence
                ? `Você já respondeu questões de ${overview.conceptsWithEvidence} dos ${plural(overview.totalConcepts, "conceito", "conceitos")}. ${plural(overview.practicingOrAbove, "está", "estão")} em prática ou acima.`
                : `${plural(overview.totalConcepts, "conceito espera", "conceitos esperam")} pela sua primeira resposta.`}
          </p>

        {overview.areas.length > 0 ? (
          <section className="progress-section report-card-section" aria-labelledby="report-title">
            <div className="progress-section-head">
              <h2 id="report-title">Boletim por área</h2>
              <p>O domínio sobe com respostas independentes, em dias e questões diferentes. Concluir aula não muda o boletim.</p>
            </div>
            <ReportCard areas={overview.areas} />
          </section>
        ) : null}

        <section className="progress-section" aria-labelledby="ladder-title">
          <div className="progress-section-head">
            <h2 id="ladder-title">Escada de domínio</h2>
            <p>Cada conceito sobe com respostas independentes, em dias e questões diferentes. Concluir aula não sobe degrau.</p>
          </div>
          <MasteryLadder rungs={overview.ladder} />
        </section>

        <section className="progress-section" aria-labelledby="memory-title">
          <div className="progress-section-head">
            <h2 id="memory-title">Memória</h2>
            <p>Retenção estimada desde o último acerto. Abaixo de 60%, ou depois de um erro, vale revisar.</p>
          </div>
          {overview.cooling.length === 0 ? (
            <p className="memory-empty">
              {hasEvidence ? "Nada esfriando agora. Os conceitos voltam para cá quando a retenção estimada cair." : "Responda questões para começar a medir a memória de cada conceito."}
            </p>
          ) : (
            <>
              <ol className="memory-list">
                {overview.cooling.map((concept) => (
                  <li key={concept.stableId}>
                    <Link href={`/concepts/${concept.stableId}`} className="memory-item">
                      <span className="memory-title">
                        <strong>{studentConceptLabel(concept.title)}</strong>
                        <small>
                          <MasteryGlyph level={masteryOrder.indexOf(concept.state)} />
                          {concept.label}
                        </small>
                      </span>
                      {concept.reason === "fading" ? (
                        <span className="memory-meter">
                          <progress value={Math.round(concept.retention * 100)} max={100} aria-hidden="true" />
                          <span>{percent.format(concept.retention)} retido</span>
                        </span>
                      ) : (
                        <span className="memory-meter is-missed">
                          <span>Errou a última resposta</span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
              <Link href="/review" className="primary-action memory-action">
                Revisar agora <ArrowRight aria-hidden="true" />
              </Link>
            </>
          )}
        </section>

        <section className="progress-section" aria-labelledby="rhythm-title">
          <div className="progress-section-head">
            <h2 id="rhythm-title">Ritmo</h2>
            <p>
              {overview.activeDaysLast28 === 0
                ? "Nenhum dia com estudo nas últimas 4 semanas. Uma sessão curta já conta."
                : `Você estudou em ${plural(overview.activeDaysLast28, "dia", "dias")} das últimas 4 semanas.`}
            </p>
          </div>
          <RhythmChart days={overview.activity} />
          <RhythmTable days={overview.activity} />
        </section>

        {showBalance ? (
          <section className="progress-section" aria-labelledby="balance-title">
            <div className="progress-section-head">
              <h2 id="balance-title">Equilíbrio por área</h2>
              <p>Nível médio de domínio em cada área, contando também os conceitos ainda não vistos.</p>
            </div>
            <div className="balance">
              <AreaBalanceChart areas={overview.areas} />
              <p className="chart-legend">Cada eixo é uma área; quanto mais longe do centro, maior o domínio médio (0 a 5). Os mesmos valores estão no boletim acima, em tabela.</p>
            </div>
          </section>
        ) : null}

        <section className="progress-section effort" aria-labelledby="effort-title">
          <div className="progress-section-head">
            <h2 id="effort-title">Esforço</h2>
            <p>XP mede dedicação. Ele nunca muda o degrau de um conceito.</p>
          </div>
          <p className="effort-total">
            <CountUp value={xp.totalXp} /> <span>XP</span>
          </p>
          {xp.transactions.length === 0 ? (
            <p className="memory-empty">Responda questões numa sessão para ganhar seus primeiros pontos.</p>
          ) : (
            <details className="effort-log">
              <summary>{xp.transactions.length === 1 ? "Ver o último registro" : `Ver os ${Math.min(xp.transactions.length, 10)} últimos registros`}</summary>
              <ol>
                {xp.transactions.slice(0, 10).map((transaction) => (
                  <li key={transaction.id}>
                    <strong>+{transaction.amount} XP</strong>
                    <span>{xpReasonLabel(transaction.reason)}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}
          <Link href="/achievements" className="effort-link">
            Nível, medalhas e missões <ArrowRight aria-hidden="true" />
          </Link>
        </section>
        </details>
      </div>
    </AppShell>
  );
}
