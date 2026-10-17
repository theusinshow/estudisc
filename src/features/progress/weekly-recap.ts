import type { ProgressOverview } from "./overview";

/** One story card of the weekly recap (ADR 0069, lab 9.8). Every number comes from the student's real record. */
export type RecapStory = Readonly<{ kicker: string; big: string; line: string; tone: "signal" | "mathematics" | "portuguese" | "science" }>;

export function buildWeeklyRecap(overview: ProgressOverview, daysToExam: number | null): RecapStory[] {
  const answered = overview.week.reduce((sum, day) => sum + day.count, 0);
  const stories: RecapStory[] = [];
  if (overview.activeDaysThisWeek === 0) {
    stories.push({ kicker: "Sua semana", big: "Bora começar?", line: "Uma questão por dia já conta para a sua semana.", tone: "signal" });
  } else {
    const days = overview.activeDaysThisWeek;
    stories.push({ kicker: "Sua semana", big: `${days} ${days === 1 ? "dia" : "dias"}`, line: `de estudo · ${answered} ${answered === 1 ? "questão respondida" : "questões respondidas"}`, tone: "signal" });
  }
  const top = [...overview.areas].filter((area) => area.practicedCount > 0).sort((a, b) => b.practicedCount - a.practicedCount || b.averageLevel - a.averageLevel)[0];
  if (top) stories.push({ kicker: "Mais praticada", big: top.title, line: `${top.practicedCount} de ${top.conceptCount} conceitos já praticados`, tone: "mathematics" });
  if (overview.totalConcepts > 0) {
    stories.push({ kicker: "Em prática ou acima", big: String(overview.practicingOrAbove), line: `de ${overview.totalConcepts} conceitos do edital`, tone: "portuguese" });
  }
  if (daysToExam !== null) stories.push({ kicker: "Faltam", big: `${daysToExam} ${daysToExam === 1 ? "dia" : "dias"}`, line: "para a prova do IFSC", tone: "science" });
  return stories;
}
