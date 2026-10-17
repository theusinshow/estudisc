import { subjectCodeFromTitle } from "@/components/ui/subject";
import { masteryStateLabels } from "@/features/mastery/mastery-policy";
import { masteryOrder, type ActivityDay, type AreaBalance } from "./overview";

const decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dayLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

/**
 * "Boletim": average mastery per area on the 0–5 scale, in ink marks plus text. The label reads the
 * same rounded state the radar uses ("em média"); it is an average, never a certified state.
 */
export function ReportCard({ areas }: Readonly<{ areas: readonly AreaBalance[] }>) {
  return <table className="report-card">
    <caption>Domínio médio por área, de 0 (não visto) a 5 (dominado), contando também os conceitos ainda não vistos.</caption>
    <thead><tr><th scope="col">Área</th><th scope="col">Domínio médio</th><th scope="col">Praticados</th></tr></thead>
    <tbody>{areas.map(area => {
      const level = Math.round(area.averageLevel);
      return <tr key={area.title} data-subject={subjectCodeFromTitle(area.title)}>
        <th scope="row">{area.title}</th>
        <td><span className="mastery-scale" aria-hidden="true">{[1, 2, 3, 4, 5].map(step => <span key={step} data-filled={step <= level || undefined} />)}</span>
          <span className="report-card-level"><strong>{decimal.format(area.averageLevel)}</strong> de 5 · {masteryStateLabels[masteryOrder[level]]} em média</span></td>
        <td className="type-meta">{area.practicedCount}/{area.conceptCount}</td>
      </tr>;
    })}</tbody>
  </table>;
}

/** Text alternative for the rhythm heatmap: the days with study records, newest first. */
export function RhythmTable({ days }: Readonly<{ days: readonly ActivityDay[] }>) {
  const studied = days.filter(day => day.count > 0 && !day.isFuture).reverse();
  return <details className="chart-alternative">
    <summary>Ver os dias em tabela</summary>
    {studied.length === 0 ? <p>Nenhum dia com estudo neste período.</p> : <table>
      <thead><tr><th scope="col">Dia</th><th scope="col">Registros de estudo</th></tr></thead>
      <tbody>{studied.map(day => <tr key={day.date}><th scope="row">{day.isToday ? "Hoje, " : ""}{dayLabel.format(new Date(`${day.date}T00:00:00Z`))}</th><td>{day.count}</td></tr>)}</tbody>
    </table>}
  </details>;
}
