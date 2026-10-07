import type { RoutineWeek } from "./routine-contracts";

export const weekdayLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function RoutineWeekView({ week, subjects }: Readonly<{ week: RoutineWeek; subjects: readonly { code: string; title: string }[] }>) {
  const names = Object.assign(Object.create(null), Object.fromEntries(subjects.map(subject => [subject.code, subject.title]))) as Record<string, string>;
  return <section className="routine-week" aria-label="Tempo da semana por matéria">
    <p>Tempo a partir de hoje. As atividades são escolhidas quando você inicia uma sessão.</p>
    <ol>{week.days.map(day => <li key={day.date} data-today={day.date === week.today || undefined}>
      <div className="routine-day-heading"><h3>{weekdayLabels[day.weekday]} <small>{day.date.slice(8)}/{day.date.slice(5, 7)}</small></h3>
        <strong>{day.status === "PAST" ? "Dia anterior" : day.status === "DAY_OFF" ? "Dia livre" : day.status === "SIMULATION_RESERVED" ? "Tempo reservado para simulado" : day.status === "BUDGET_USED" ? "Tempo planejado concluído" : `${day.remainingMinutes} min para estudo`}</strong></div>
      {day.startTime && day.status !== "PAST" && <p>Horário sugerido: {day.startTime}</p>}
      {day.allocations.length > 0 && <ul>{day.allocations.map(item => <li key={item.subjectCode}><span>{names[item.subjectCode] ?? item.subjectCode}</span><strong>{item.minutes} min</strong></li>)}</ul>}
      {day.simulationMinutes > 0 && <p>{day.simulationMinutes} min reservados para simulado.</p>}
      {day.reviewMinutes > 0 && <p>Meta: {day.reviewMinutes} min de revisão dentro do tempo das matérias.</p>}
      {day.completedMinutes > 0 && <p>{day.completedMinutes} min planejados em sessões concluídas. Não é uma medida de tempo decorrido.</p>}
      {day.unallocatedMinutes > 0 && day.status !== "PAST" && <p>{day.unallocatedMinutes} min ainda sem matéria definida.</p>}
      {day.warnings.includes("SIMULATION_DOES_NOT_FIT") && <p role="status">O simulado não cabe na mudança de tempo deste dia. Ajuste a duração ou escolha outro dia.</p>}
      {day.warnings.includes("MANUAL_ALLOCATION_CAPPED") && <p role="status">A distribuição manual foi reduzida proporcionalmente para caber no tempo deste dia.</p>}
    </li>)}</ol>
  </section>;
}
