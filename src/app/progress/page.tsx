import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { getXpSummary } from "@/features/gamification/api";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const xp = await getXpSummary();

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-progress" aria-labelledby="progress-title">
        <p className="eyebrow">Sua jornada</p>
        <h1 id="progress-title">Progresso</h1>
        <p>XP mostra o quanto você se dedicou. O domínio de cada conceito vem das suas respostas, não dos pontos.</p>
        <Link className="today-action study-next-action" href="/tracks">
          <strong>Continuar estudando</strong>
          <span>Volte ao catálogo para abrir a próxima aula ou revisar a trilha ativa.</span>
        </Link>

        <section className="module-section" aria-labelledby="xp-title">
          <h2 id="xp-title">XP</h2>
          <div className="mastery-panel" aria-label="XP acumulado">
            <p className="technical-label">Pontos de esforço</p>
            <p className="mastery-score">
              {xp.totalXp} <span>XP</span>
            </p>
            <p className="lesson-text">{xp.transactions.length === 1 ? "1 registro" : `${xp.transactions.length} registros`} de pontos.</p>
          </div>
        </section>

        <section className="module-section" aria-labelledby="xp-events-title">
          <h2 id="xp-events-title">Transações</h2>
          {xp.transactions.length === 0 ? (
            <p className="lesson-text">Responda questões numa sessão para ganhar seus primeiros pontos.</p>
          ) : (
            <ol className="record-list" aria-label="Transações de XP">
              {xp.transactions.map((transaction) => (
                <li key={transaction.id}>
                  <div>
                    <strong>+{transaction.amount} XP</strong>
                    <span>{transaction.reason}</span>
                    <small>
                      {transaction.sourceType} · {transaction.sourceId}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </AppShell>
  );
}
