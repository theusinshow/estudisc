import Link from "next/link";
import { sessionItemsSchema } from "@/features/study-sessions/contracts";
import { SessionControls } from "@/features/study-sessions/session-controls";
import type { getTodayDashboard } from "./get-today-dashboard";

type Sessions = Awaited<ReturnType<typeof getTodayDashboard>>["sessions"];

/** Show actual session snapshots; do not invent a weekly routine or estimated work. */
export function TodayPlan({ sessions, hasNextAction, plannerEnabled }: Readonly<{
  sessions: Sessions;
  hasNextAction: boolean;
  plannerEnabled: boolean;
}>) {
  const open = sessions.filter(session => session.status === "ACTIVE" || session.status === "PLANNED");
  return <section className="today-queue" aria-labelledby="today-plan-title">
    <div className="today-week-head"><h2 id="today-plan-title">Suas sessões</h2>{plannerEnabled && <Link href="/plan">Ver plano</Link>}</div>
    {open.length ? <ol>{open.map(session => {
      const items = sessionItemsSchema.parse(session.items);
      return <li key={session.id}><Link href={`/study/${session.id}`}>
        <span><strong>{session.status === "ACTIVE" ? "Continuar sessão" : "Sessão preparada"} · {session.budgetMinutes} min</strong>
          <small>{items.map(item => item.title).join(" · ")}</small></span>
      </Link></li>;
    })}</ol> : hasNextAction ? <>
      <p>Você ainda não preparou uma sessão. Quanto tempo tem para estudar agora?</p>
      <SessionControls />
    </> : <p>Quando houver atividades disponíveis, você poderá preparar uma sessão aqui.</p>}
  </section>;
}
