import { describe, expect, it } from "vitest";
import { buildRoutineWeek, localDate, normalizeRoutine, routineSessionLimits, type RoutineContext } from "@/features/study-sessions/routine-policy";
import { routineSettingsSchema, type RoutineSettings } from "@/features/study-sessions/routine-contracts";

const monday = new Date("2026-10-05T15:00:00Z");
const settings = (patch: Partial<RoutineSettings> = {}): RoutineSettings => ({ timezone: "America/Sao_Paulo", mode: "ASSISTED",
  days: Array.from({ length: 7 }, (_, weekday) => ({ weekday, minutes: weekday > 0 && weekday < 6 ? 60 : 0 })),
  subjects: [{ code: "MAT", priority: "normal" }, { code: "POR", priority: "normal" }], manualAllocations: [], overrides: [], reviewPercent: 20, ...patch });
const context: RoutineContext = { subjectCodes: ["MAT", "POR"], sessions: [] };
const session = (endedAt: string, minutes = 30) => ({ id: "11111111-1111-4111-8111-111111111111", status: "COMPLETED", startedAt: new Date(endedAt), endedAt: new Date(endedAt), createdAt: new Date(endedAt),
  items: [{ lessonId: "mat", version: 1, title: "Aula", subjectCode: "MAT", minutes, activityIds: ["q"], questions: [{ id: "q", version: 1 }] }] });

describe("routine.v1", () => {
  it("supports generic Pack subject identifiers without inheriting JavaScript object keys", () => {
    const input = settings({ subjects: [{ code: "constructor", priority: "normal" }, { code: "__proto__", priority: "normal" }] });
    const week = buildRoutineWeek(input, { subjectCodes: ["constructor", "__proto__"], sessions: [] }, monday);
    expect(week.days[0].allocations).toEqual([{ subjectCode: "__proto__", minutes: 30 }, { subjectCode: "constructor", minutes: 30 }]);
  });
  it("allocates equal automatic or explicit weighted assisted budgets with stable ties", () => {
    const input = settings({ subjects: [{ code: "MAT", priority: "high" }, { code: "POR", priority: "low" }], days: settings().days.map(day => ({ ...day, minutes: day.weekday === 1 ? 60 : 0 })) });
    expect(routineSessionLimits(buildRoutineWeek(input, context, monday))).toEqual({ MAT: 45, POR: 15 });
    expect(routineSessionLimits(buildRoutineWeek({ ...input, mode: "AUTOMATIC" }, context, monday))).toEqual({ MAT: 30, POR: 30 });
    expect(buildRoutineWeek({ ...input, subjects: [...input.subjects].reverse(), days: [...input.days].reverse() }, context, monday)).toEqual(buildRoutineWeek(input, context, monday));
  });

  it("rebalances remaining time after completed work without moving missed-day debt", () => {
    const now = new Date("2026-10-07T15:00:00Z");
    const week = buildRoutineWeek(settings(), { ...context, sessions: [session("2026-10-05T15:00:00Z")] }, now);
    expect(week.days.slice(0, 2).every(day => day.status === "PAST" && day.allocations.length === 0 && day.remainingMinutes === 0)).toBe(true);
    expect(routineSessionLimits(week)).toEqual({ MAT: 15, POR: 45 });
    expect(week.days.slice(2).reduce((sum, day) => sum + day.remainingMinutes, 0)).toBe(180);
    expect(week.days.every(day => day.allocations.reduce((sum, item) => sum + item.minutes, 0) <= day.remainingMinutes)).toBe(true);
  });

  it("counts planned completed minutes in the local day, never the declared maximum budget", () => {
    const week = buildRoutineWeek(settings(), { ...context, sessions: [session("2026-10-05T15:00:00Z", 15)] }, monday);
    expect(week.days[0].completedMinutes).toBe(15);
    expect(week.days[0].remainingMinutes).toBe(45);
    expect(routineSessionLimits(week)).toEqual({ MAT: 15, POR: 30 });
    expect(buildRoutineWeek(settings(), { ...context, sessions: [session("2026-10-05T15:00:00Z", 70)] }, monday).days[0].status).toBe("BUDGET_USED");
    expect(buildRoutineWeek(settings(), { ...context, sessions: [session("2026-10-05T15:00:00Z", 1.5)] }, monday).days[0].completedMinutes).toBe(2);
  });

  it("preserves manual choices and visibly caps a temporary reduction, leaving unassigned time", () => {
    const input = settings({ mode: "MANUAL", manualAllocations: [{ weekday: 1, subjectCode: "MAT", minutes: 40 }, { weekday: 1, subjectCode: "POR", minutes: 20 }], overrides: [{ date: "2026-10-05", minutes: 30 }] });
    const day = buildRoutineWeek(input, context, monday).days[0];
    expect(day.allocations).toEqual([{ subjectCode: "MAT", minutes: 20 }, { subjectCode: "POR", minutes: 10 }]);
    expect(day.warnings).toContain("MANUAL_ALLOCATION_CAPPED");
    expect(buildRoutineWeek({ ...input, overrides: [] }, context, monday).days[1].unallocatedMinutes).toBe(60);
    expect(buildRoutineWeek(input, context, new Date("2026-10-07T15:00:00Z")).days[0].warnings).toEqual([]);
  });

  it("reserves complete simulation time and treats reviews as an included target", () => {
    const input = settings({ simulation: { weekday: 1, minutes: 30 } });
    const day = buildRoutineWeek(input, context, monday).days[0];
    expect(day.simulationMinutes).toBe(30);
    expect(day.remainingMinutes).toBe(30);
    expect(day.reviewMinutes).toBe(6);
    expect(day.allocations.reduce((sum, item) => sum + item.minutes, 0) + day.simulationMinutes).toBe(60);
    expect(buildRoutineWeek({ ...input, simulation: { weekday: 1, minutes: 60 } }, context, monday).days[0].status).toBe("SIMULATION_RESERVED");
    const reduced = buildRoutineWeek({ ...input, overrides: [{ date: "2026-10-05", minutes: 10 }] }, context, monday).days[0];
    expect(reduced.simulationMinutes).toBe(0);
    expect(reduced.remainingMinutes).toBe(10);
    expect(reduced.warnings).toEqual(["SIMULATION_DOES_NOT_FIT"]);
  });

  it("applies dated focus only within its interval and leaves ACTIVE snapshots untouched", () => {
    const input = settings({ mode: "AUTOMATIC", focus: { subjectCode: "MAT", from: "2026-10-05", until: "2026-10-05" } });
    const active = { ...session("2026-10-05T15:00:00Z"), status: "ACTIVE", endedAt: null };
    const before = structuredClone(active);
    const week = buildRoutineWeek(input, { ...context, sessions: [active] }, monday);
    expect(routineSessionLimits(week)).toEqual({ MAT: 45, POR: 15 });
    expect(week.activeSessionId).toBe(active.id);
    expect(active).toEqual(before);
    expect(buildRoutineWeek(input, context, new Date("2026-10-06T15:00:00Z")).days[1].allocations).toEqual([{ subjectCode: "MAT", minutes: 30 }, { subjectCode: "POR", minutes: 30 }]);
  });

  it("uses calendar weeks and timezone dates across midnight and DST without 24-hour local arithmetic", () => {
    expect(localDate(new Date("2026-10-05T02:30:00Z"), "America/Sao_Paulo")).toBe("2026-10-04");
    expect(localDate(new Date("2026-03-08T06:59:00Z"), "America/New_York")).toBe("2026-03-08");
    const week = buildRoutineWeek(settings({ timezone: "America/New_York" }), context, new Date("2026-03-08T07:01:00Z"));
    expect(week.weekStart).toBe("2026-03-02");
    expect(week.days[6].date).toBe("2026-03-08");
  });

  it("validates duplicate/calendar/timezone/over-allocation and preserves canonical sorted settings", () => {
    expect(() => normalizeRoutine(settings({ timezone: "unknown/timezone" }))).toThrow();
    expect(() => normalizeRoutine(settings({ timezone: "+04:00" }))).toThrow();
    expect(() => normalizeRoutine(settings({ overrides: [{ date: "2026-02-30", minutes: 15 }] }))).toThrow();
    expect(() => normalizeRoutine(settings({ simulation: { weekday: 0, minutes: 30 } }))).toThrow();
    expect(() => normalizeRoutine(settings({ mode: "MANUAL", manualAllocations: [{ weekday: 1, subjectCode: "MAT", minutes: 70 }] }))).toThrow();
    expect(routineSettingsSchema.safeParse(settings({ days: settings().days.map(day => ({ ...day, weekday: 1 })) })).success).toBe(false);
    expect(() => normalizeRoutine(settings({ days: settings().days.map(day => ({ ...day, startTime: "23:45" })) }))).toThrow();
  });
});
