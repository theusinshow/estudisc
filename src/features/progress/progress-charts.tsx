"use client";

import { ActivityHeatmapChart, type ActivityHeatmapMonth } from "@/components/matos-ui/activity-heatmap-chart";
import { ScoreRadarChart } from "@/components/matos-ui/score-radar-chart";
import { masteryStateLabels } from "@/features/mastery/mastery-policy";
import { masteryOrder, type ActivityDay, type AreaBalance } from "./overview";

// Day keys are calendar dates already resolved in the study time zone; format them as UTC dates.
const dayLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

function studyCount(value: number) {
  if (value === 0) return "Sem estudo";
  return value === 1 ? "1 registro de estudo" : `${value} registros de estudo`;
}

function monthMarks(days: readonly ActivityDay[]): ActivityHeatmapMonth[] {
  const marks: ActivityHeatmapMonth[] = [];
  for (let column = 0; column * 7 < days.length; column += 1) {
    const week = days.slice(column * 7, column * 7 + 7);
    const firstOfMonth = column === 0 ? week[0] : week.find((day) => day.date.endsWith("-01"));
    // Skip a label that would collide with the previous one.
    if (firstOfMonth && (marks.length === 0 || column - marks[marks.length - 1].column >= 3)) {
      marks.push({ column, label: monthLabel.format(new Date(`${firstOfMonth.date}T00:00:00Z`)).replace(".", "") });
    }
  }
  return marks;
}

export function RhythmChart({ days }: Readonly<{ days: readonly ActivityDay[] }>) {
  const data = days.map((day) => ({
    value: day.count,
    isToday: day.isToday,
    label: `${day.isToday ? "Hoje, " : ""}${dayLabel.format(new Date(`${day.date}T00:00:00Z`))}`
  }));

  return (
    <ActivityHeatmapChart
      data={data}
      weeks={Math.ceil(days.length / 7)}
      months={monthMarks(days)}
      title="Dias com estudo nas últimas semanas"
      valueFormatter={studyCount}
    />
  );
}

export function AreaBalanceChart({ areas }: Readonly<{ areas: readonly AreaBalance[] }>) {
  const data = areas.map((area) => ({
    label: area.title,
    value: area.averageLevel,
    detail: `${masteryStateLabels[masteryOrder[Math.round(area.averageLevel)]]} em média · ${area.practicedCount}/${area.conceptCount} praticados`
  }));

  return <ScoreRadarChart data={data} maxValue={5} title="Nível médio de domínio por área" />;
}
