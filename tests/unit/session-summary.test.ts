import { expect, it } from "vitest";
import { summarizeSession } from "@/features/study-sessions/session-summary";

it("reports actual attempts/evidence and a wall interval without inventing mastery or active study time", () => {
  const session = { budgetMinutes: 20, startedAt: new Date("2026-10-06T12:00Z"), endedAt: new Date("2026-10-06T12:07Z"), items: [{ lessonId: "lesson", version: 1, title: "Aula", subjectCode: "MAT", minutes: 8, activityIds: ["a"], questions: [{ id: "q", version: 1 }] }] };
  const summary = summarizeSession(session, [{ key: "q", outcome: "failed" }, { key: "q", outcome: "passed" }], [
    { conceptId: "c", title: "Conceito", strength: 50, conditions: { outcome: "passed", hintLevel: 0, solutionRevealed: false, delayedRetrieval: true } },
    { conceptId: "assisted", title: "Com ajuda", strength: 30, conditions: { outcome: "passed", hintLevel: 1, solutionRevealed: false } }
  ]);
  expect(summary).toMatchObject({ budgetMinutes: 20, plannedMinutes: 8, wallMinutes: 7, answered: 1, correct: 1, attempts: 2, reviewedConcepts: 1 });
  expect(summary.independentConcepts).toEqual([{ id: "c", title: "Conceito" }]);
  expect(summarizeSession(session, [], []).independentConcepts).toEqual([]);
});
