import { expect, it } from "vitest";
import { assertRoutineBudget, assertRoutineStart } from "@/features/study-sessions/routine-session-constraints";
import { planCandidates, type PlannerCandidate } from "@/features/study-sessions/planner-policy";
import { buildRoutineWeek } from "@/features/study-sessions/routine-policy";
import type { RoutineSettings } from "@/features/study-sessions/routine-contracts";

it("caps selected subjects cumulatively without changing legacy priorities", () => {
  const base: PlannerCandidate = { id: "a", subjectCode: "MAT", kind: "practice", minutes: 15, importance: 1, weakness: 1, dueDays: 0, requiredPrerequisitesReady: true, plannerReady: true, reserved: false };
  const choices = [base, { ...base, id: "b" }, { ...base, id: "c", subjectCode: "POR" }];
  const constrained = planCandidates(choices, 60, "BUILD", {}, { MAT: 15 });
  expect(constrained.items.map(item => item.id)).toEqual(["a"]);
  expect(constrained.policyVersion).toBe("planner.v1+routine.v1");
  expect(planCandidates(choices, 60, "BUILD", {}).items).toHaveLength(3);
  expect(planCandidates(choices, 60, "BUILD", {}).policyVersion).toBe("planner.v1");
});

it("rejects a prepared session after an explicit day-off override and never constrains a missing routine", () => {
  const settings: RoutineSettings = { timezone: "UTC", mode: "AUTOMATIC", subjects: [{ code: "MAT", priority: "normal" }], days: Array.from({ length: 7 }, (_, weekday) => ({ weekday, minutes: 30 })), overrides: [{ date: "2026-10-05", minutes: 0 }], manualAllocations: [], reviewPercent: 20 };
  const week = buildRoutineWeek(settings, { subjectCodes: ["MAT"], sessions: [] }, new Date("2026-10-05T15:00:00Z"));
  expect(() => assertRoutineBudget(week, 15)).toThrow("routine_budget_exceeded");
  const items = [{ lessonId: "a", version: 1, title: "Aula", subjectCode: "MAT", minutes: 15, activityIds: ["a"], questions: [{ id: "q", version: 1 }] }];
  expect(() => assertRoutineStart(week, items)).toThrow("routine_budget_exceeded");
  expect(() => assertRoutineStart(week, items.map(item => ({ ...item, subjectCode: "constructor" })))).toThrow("routine_budget_exceeded");
  expect(assertRoutineBudget(null, 60)).toBeUndefined();
  expect(() => assertRoutineStart(null, items)).not.toThrow();
});
