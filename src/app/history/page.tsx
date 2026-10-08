import { AppShell } from "@/components/layout/app-shell";
import { listHistoryEvents } from "@/features/history/api";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const events = await safeListEvents();
  const items=events.items.filter(event=>!["ai_request","evolution_schema_activation"].includes(event.type));

  return (
    <AppShell>
      <section className="foundation-panel content-panel" aria-labelledby="history-title">
        <p className="eyebrow">Histórico</p>
        <h1 id="history-title">Eventos</h1>
        {events.status === "not_configured" ? (
          <p>Configure `DATABASE_URL` ou use `pglite://memory` em desenvolvimento para ler o histórico.</p>
        ) : items.length === 0 ? (
          <p>Nenhum evento registrado. RUN não cria tentativa; SUBMIT registra a primeira entrada oficial.</p>
        ) : (
          <ol className="record-list" aria-label="Eventos de estudo">
            {items.map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{event.type==="ai_completion"?"Apoio de IA":event.type==="mistake_reflection"?"Reflexão sobre um erro":event.type}</strong>
                  <span>
                    {event.type==="ai_completion"?"Registro da consulta opcional":event.type==="mistake_reflection"?"Percepção informada pelo aluno":`${event.entityType}: ${event.entityId}`}
                  </span>
                  <small>{new Date(event.occurredAt).toLocaleString("pt-BR")}</small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AppShell>
  );
}

async function safeListEvents() {
  try {
    return { status: "ok" as const, items: await listHistoryEvents() };
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL is not configured") {
      return { status: "not_configured" as const, items: [] };
    }

    throw error;
  }
}
