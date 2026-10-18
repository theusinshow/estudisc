import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

/** ADR 0072: time-budget sessions are retired; an old link shows what was answered and leads back to Hoje. */
export function LegacySessionSummary({ result }: Readonly<{ result: Readonly<{ session: Readonly<{ status: string }>; answered: number; correct: number }> }>) {
  return <AppShell>
    <article className="foundation-panel content-panel study-session" data-status={result.session.status}>
      <header className="study-header"><p className="eyebrow">Estudo anterior</p><h1>Este estudo foi encerrado</h1></header>
      <p>Agora você estuda pelas aulas e pratica revisões e erros em blocos curtos. As respostas que você deu aqui continuam valendo.</p>
      <ul className="session-tally">
        <li><strong>{result.answered}</strong> {result.answered === 1 ? "questão respondida" : "questões respondidas"}</li>
        <li><strong>{result.correct}</strong> {result.correct === 1 ? "correta" : "corretas"}</li>
      </ul>
      <Link className="primary-action" href="/">Ir para Hoje</Link>
    </article>
  </AppShell>;
}
