import { Check, RotateCcw } from "lucide-react";
import "@/styles/history.css";
import { AppShell } from "@/components/layout/app-shell";
import { MathText } from "@/components/ui/paragraphs";
import { listHistoryEvents, listRecentAnswers } from "@/features/history/api";
export const dynamic = "force-dynamic";

const when = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
/** Student-facing names for recorded study events; technical and AI-request rows stay out of the page. */
const eventLabels: Record<string, string> = {
  activity_submitted: "Atividade de programação enviada",
  assessment_finalized: "Simulado finalizado",
  review_completed: "Revisão concluída",
  review_reflection: "Reflexão de revisão",
  mistake_reflection: "Reflexão sobre um erro",
  study_plan_applied: "Plano de estudo aplicado",
  question_assistance: "Ajuda pedida numa questão",
  ai_completion: "Apoio de IA"
};
const shorten = (stem: string) => { const text = stem.replace(/\s+/g, " ").trim(); return text.length > 140 && !text.includes("$") ? `${text.slice(0, 137)}…` : text; };

export default async function HistoryPage() {
  const [answers, events] = await Promise.all([safe(listRecentAnswers), safe(listHistoryEvents)]);
  const items = events.items.filter(event => !["ai_request", "evolution_schema_activation"].includes(event.type));
  return (
    <AppShell>
      <section className="foundation-panel content-panel history-page" aria-labelledby="history-title">
        <p className="eyebrow">Você</p>
        <h1 id="history-title">Histórico</h1>
        {answers.status === "not_configured" ? (
          <p>O histórico fica disponível quando o banco de dados estiver configurado.</p>
        ) : <>
          <section aria-labelledby="history-answers-title">
            <h2 id="history-answers-title">Suas últimas respostas</h2>
            {answers.items.length === 0 ? <p>Quando você responder questões, elas aparecem aqui, com o resultado e a data.</p> : (
              <ol className="history-answers" aria-labelledby="history-answers-title">
                {answers.items.map(answer => {
                  const right = answer.outcome === "passed";
                  return (
                    <li key={answer.id} data-result={right ? "correct" : "incorrect"}>
                      <span className="history-mark" aria-hidden="true">{right ? <Check /> : <RotateCcw />}</span>
                      <span className="history-answer-text">
                        <span className="history-stem"><MathText text={shorten(answer.stem)} /></span>
                        <small>
                          <strong>{right ? "Acertou" : "Errou"}</strong>{right && answer.assisted ? " com ajuda" : ""}
                          {" · "}{answer.mode === "assessment" ? "Simulado" : "Aula ou revisão"}{" · "}
                          <time dateTime={answer.createdAt.toISOString()}>{when.format(answer.createdAt)}</time>
                        </small>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
          {items.length > 0 && (
            <section aria-labelledby="history-events-title">
              <h2 id="history-events-title">Outros registros</h2>
              <ol className="record-list" aria-label="Outros registros">
                {items.map(event => (
                  <li key={event.id}>
                    <div>
                      <strong>{eventLabels[event.type] ?? "Registro de estudo"}</strong>
                      {event.type === "ai_completion" ? <span>Registro da consulta opcional</span> : event.type === "mistake_reflection" ? <span>Percepção informada por você</span> : null}
                      <small>{when.format(new Date(event.occurredAt))}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>}
      </section>
    </AppShell>
  );
}

async function safe<T>(read: () => Promise<T[]>) {
  try {
    return { status: "ok" as const, items: await read() };
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL is not configured") {
      return { status: "not_configured" as const, items: [] as T[] };
    }
    throw error;
  }
}
