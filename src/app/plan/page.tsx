import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Tabs } from "@/components/ui/tabs";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getDatabaseUrl } from "@/db/connection";
import { getOwnerId } from "@/features/auth/owner";
import { studySessionRepository } from "@/features/study-sessions/api";
import { SessionControls } from "@/features/study-sessions/session-controls";
import { sessionItemsSchema } from "@/features/study-sessions/contracts";
import { studyPlanRepository } from "@/features/study-sessions/routine-api";
import { RoutinePlanner } from "@/features/study-sessions/routine-planner";
import { remainingRoutineMinutes } from "@/features/study-sessions/routine-session-constraints";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  if (!getFeatureFlags().FEATURE_STUDY_PLANNER) notFound();
  const ownerId = await getOwnerId();
  const sessions = getDatabaseUrl() ? await studySessionRepository().list(ownerId) : [];
  const routineState = getDatabaseUrl() ? await studyPlanRepository().getState(ownerId) : null;
  const planned = sessions.filter(session => session.status === "ACTIVE" || session.status === "PLANNED");
  const completed = sessions.filter(session => session.status === "COMPLETED");

  function sessionList(rows: typeof sessions, empty: string) {
    if (!rows.length) return <p>{empty}</p>;
    return <ul className="plan-session-list">{rows.map(session => (
      <li key={session.id}>
        <h3>{session.status === "ACTIVE" ? "Sessão em andamento" : session.status === "COMPLETED" ? "Sessão concluída" : "Sessão preparada"}</h3>
        <span className="session-duration">{session.budgetMinutes} min planejados</span>
        <ol>{sessionItemsSchema.parse(session.items).map(item => <li key={item.lessonId}>{item.title} · {item.minutes} min</li>)}</ol>
        <Link href={`/study/${session.id}`}>{session.status === "COMPLETED" ? "Ver resultado" : "Abrir sessão"}</Link>
      </li>
    ))}</ul>;
  }

  return <AppShell><article className="foundation-panel content-panel">
    <h1>Plano</h1>
    <p>Escolha o tempo para uma sessão ou retome o estudo que você já preparou.</p>
    {routineState ? <RoutinePlanner key={routineState.routine?.revision ?? 0} initial={routineState} /> : <p>A rotina persistente está indisponível no momento. Tente novamente mais tarde.</p>}
    <section aria-labelledby="prepare-session"><h2 id="prepare-session">Preparar uma sessão</h2>
      <p>As atividades disponíveis são escolhidas com base no seu estudo e nas revisões.</p>
      <SessionControls availableMinutes={routineState?.week?.activeSessionId ? undefined : remainingRoutineMinutes(routineState?.week ?? null)} />
    </section>
    <Tabs label="Suas sessões" tabs={[
      { id: "next", label: "Próximas sessões", content: sessionList(planned, "Nenhuma sessão preparada. Escolha um tempo para começar.") },
      { id: "completed", label: "Concluídas", content: sessionList(completed, "Você ainda não concluiu uma sessão.") }
    ]} />
  </article></AppShell>;
}
