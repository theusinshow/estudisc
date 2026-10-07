import Link from "next/link";
import { sessionItemsSchema } from "@/features/study-sessions/contracts";
import { SessionControls } from "@/features/study-sessions/session-controls";
import type { getTodayDashboard } from "./get-today-dashboard";
import type { RoutineState } from "@/features/study-sessions/routine-contracts";
import { remainingRoutineMinutes } from "@/features/study-sessions/routine-session-constraints";
import { getFeatureFlags } from "@/lib/feature-flags";

type Sessions = Awaited<ReturnType<typeof getTodayDashboard>>["sessions"];

/** Show actual session snapshots; do not invent a weekly routine or estimated work. */
export function TodayPlan({ sessions, hasNextAction, plannerEnabled, routine }: Readonly<{
  sessions: Sessions;
  hasNextAction: boolean;
  plannerEnabled: boolean;
  routine: RoutineState | null;
}>) {
  const open = sessions.filter(session => session.status === "ACTIVE" || session.status === "PLANNED");
  const today = routine?.week?.days.find(day => day.date === routine.week?.today);
  return <section className="today-queue" aria-labelledby="today-plan-title">
    <div className="today-week-head"><h2 id="today-plan-title">Suas sessões</h2>{plannerEnabled && <Link href="/plan">Ver plano</Link>}</div>
    {open.length ? <ol>{open.map(session => {
      const items = sessionItemsSchema.parse(session.items);
      return <li key={session.id}><Link href={`/study/${session.id}`}>
        <span><strong>{session.status === "ACTIVE" ? "Continuar sessão" : "Sessão preparada"} · {session.budgetMinutes} min</strong>
          <small>{items.map(item => item.title).join(" · ")}</small></span>
      </Link></li>;
    })}</ol> : today?.status === "DAY_OFF" ? <p>Hoje é dia livre na sua rotina. As revisões continuam disponíveis quando você quiser.</p>
      : today?.status === "BUDGET_USED" ? <p>Você concluiu o tempo planejado de hoje. Confira seu progresso ou ajuste a rotina se quiser continuar.</p>
      : today?.status === "SIMULATION_RESERVED" ? <p>O tempo de hoje está reservado para simulado. <Link href="/assessments">Escolher um simulado</Link></p>
      : hasNextAction ? <>
      <p>Você ainda não preparou uma sessão. Quanto tempo tem para estudar agora?</p>
      {plannerEnabled && !routine?.routine && <p><Link href="/plan">Organizar minha semana</Link></p>}
      <SessionControls adaptive={getFeatureFlags().FEATURE_ADAPTIVE_SESSION} availableMinutes={remainingRoutineMinutes(routine?.week ?? null)} />
    </> : <p>Quando houver atividades disponíveis, você poderá preparar uma sessão aqui.</p>}
  </section>;
}
