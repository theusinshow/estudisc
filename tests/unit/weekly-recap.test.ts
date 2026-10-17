import { describe, expect, it } from "vitest";

import type { ProgressOverview } from "@/features/progress/overview";
import { buildWeeklyRecap } from "@/features/progress/weekly-recap";

const base: ProgressOverview = {
  totalConcepts: 0, conceptsWithEvidence: 0, practicingOrAbove: 0, ladder: [], cooling: [], areas: [], activity: [],
  week: [], activeDaysLast28: 0, activeDaysThisWeek: 0, streakDays: 0
};
const day = (count: number) => ({ date: "2026-10-12", count, weekday: 1, isToday: false, isFuture: false });

describe("buildWeeklyRecap", () => {
  it("encourages instead of showing zeros when nothing was studied", () => {
    const stories = buildWeeklyRecap(base, 43);
    expect(stories.map((s) => s.big)).toEqual(["Bora começar?", "43 dias"]);
  });

  it("uses only real numbers: days, answers, top practiced area and concepts", () => {
    const stories = buildWeeklyRecap({
      ...base, totalConcepts: 120, practicingOrAbove: 9, activeDaysThisWeek: 3, week: [day(4), day(0), day(6)],
      areas: [{ title: "Português", conceptCount: 30, practicedCount: 2, averageLevel: 1 }, { title: "Matemática", conceptCount: 40, practicedCount: 7, averageLevel: 2 }]
    }, 1);
    expect(stories).toEqual([
      { kicker: "Sua semana", big: "3 dias", line: "de estudo · 10 questões respondidas", tone: "signal" },
      { kicker: "Mais praticada", big: "Matemática", line: "7 de 40 conceitos já praticados", tone: "mathematics" },
      { kicker: "Em prática ou acima", big: "9", line: "de 120 conceitos do edital", tone: "portuguese" },
      { kicker: "Faltam", big: "1 dia", line: "para a prova do IFSC", tone: "science" }
    ]);
  });

  it("omits the countdown after the exam", () => {
    expect(buildWeeklyRecap(base, null).some((s) => s.kicker === "Faltam")).toBe(false);
  });
});
