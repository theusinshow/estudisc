import { sessionItemsSchema } from "./contracts";
import { ROUTINE_POLICY, routineSettingsSchema, routineWeekSchema, type RoutineSettings, type RoutineWeek } from "./routine-contracts";

export type RoutineSessionFact = Readonly<{ id: string; status: string; items: unknown; startedAt: Date | null; endedAt: Date | null; createdAt: Date }>;
export type RoutineContext = Readonly<{ subjectCodes: readonly string[]; sessions: readonly RoutineSessionFact[] }>;

export function localDate(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function addCalendarDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function calendarWeekday(date: string) { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
const byCode = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function normalizeRoutine(input: unknown): RoutineSettings {
  const settings = routineSettingsSchema.parse(input);
  return { ...settings, days: [...settings.days].sort((a, b) => a.weekday - b.weekday),
    subjects: [...settings.subjects].sort((a, b) => byCode(a.code, b.code)),
    manualAllocations: [...settings.manualAllocations].sort((a, b) => a.weekday - b.weekday || byCode(a.subjectCode, b.subjectCode)),
    overrides: [...settings.overrides].sort((a, b) => byCode(a.date, b.date)) };
}

function distribute(minutes: number, weights: Record<string, number>, history: Readonly<Record<string, number>>) {
  const codes = Object.keys(weights).sort(byCode);
  const allocated = Object.fromEntries(codes.map(code => [code, 0]));
  for (let remaining = minutes; remaining > 0;) {
    const unit = Math.min(15, remaining);
    const next = [...codes].sort((a, b) => ((history[a] ?? 0) + allocated[a] + unit) * weights[b] - ((history[b] ?? 0) + allocated[b] + unit) * weights[a] || byCode(a, b))[0];
    allocated[next] += unit;
    remaining -= unit;
  }
  return allocated;
}

export function buildRoutineWeek(input: RoutineSettings, context: RoutineContext, now: Date): RoutineWeek {
  const settings = normalizeRoutine(input);
  const today = localDate(now, settings.timezone);
  const weekStart = addCalendarDays(today, -((calendarWeekday(today) + 6) % 7));
  const completed = context.sessions.filter(session => session.status === "COMPLETED" && session.endedAt && localDate(session.endedAt, settings.timezone) >= weekStart && localDate(session.endedAt, settings.timezone) <= today);
  const history: Record<string, number> = Object.create(null);
  const perDate: Record<string, Record<string, number>> = Object.create(null);
  for (const session of completed) {
    const date = localDate(session.endedAt!, settings.timezone);
    const day = perDate[date] ??= Object.create(null);
    for (const item of sessionItemsSchema.parse(session.items)) {
      const declaredMinutes = Math.ceil(item.minutes);
      history[item.subjectCode] = (history[item.subjectCode] ?? 0) + declaredMinutes;
      day[item.subjectCode] = (day[item.subjectCode] ?? 0) + declaredMinutes;
    }
  }
  const days: RoutineWeek["days"] = [];
  for (let offset = 0; offset < 7; offset++) {
    const date = addCalendarDays(weekStart, offset), weekday = calendarWeekday(date);
    const base = settings.days.find(day => day.weekday === weekday)!;
    const override = settings.overrides.find(item => item.date === date);
    const available = override?.minutes ?? base.minutes;
    const completedMinutes = Object.values(perDate[date] ?? {}).reduce((sum, value) => sum + value, 0);
    const warnings: RoutineWeek["days"][number]["warnings"] = [];
    let simulationMinutes = date >= today && settings.simulation?.weekday === weekday ? settings.simulation.minutes : 0;
    if (simulationMinutes > available) { simulationMinutes = 0; warnings.push("SIMULATION_DOES_NOT_FIT"); }
    const studyMinutes = date < today ? 0 : Math.max(0, available - simulationMinutes);
    const remainingMinutes = Math.max(0, studyMinutes - completedMinutes);
    let allocation: Record<string, number> = Object.create(null);
    if (settings.mode === "MANUAL" && date >= today) {
      for (const item of settings.manualAllocations.filter(item => item.weekday === weekday)) allocation[item.subjectCode] = Math.max(0, item.minutes - (perDate[date]?.[item.subjectCode] ?? 0));
      const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
      if (total > remainingMinutes) {
        warnings.push("MANUAL_ALLOCATION_CAPPED");
        // Stable largest-remainder cap preserves the user's manual proportions without adding time.
        const codes = Object.keys(allocation).sort(byCode);
        const capped = Object.fromEntries(codes.map(code => [code, Math.floor(allocation[code] * remainingMinutes / total)]));
        let spare = remainingMinutes - Object.values(capped).reduce((sum, value) => sum + value, 0);
        const order = [...codes].sort((a, b) => (allocation[b] * remainingMinutes % total) - (allocation[a] * remainingMinutes % total) || byCode(a, b));
        for (const code of order) { if (spare-- > 0) capped[code]++; }
        allocation = capped;
      }
    } else if (remainingMinutes > 0) {
      const weights = Object.fromEntries(settings.subjects.map(subject => [subject.code,
        (settings.mode === "AUTOMATIC" ? 1 : { low: 1, normal: 2, high: 3 }[subject.priority]) *
        (settings.focus?.subjectCode === subject.code && date >= settings.focus.from && date <= settings.focus.until ? 2 : 1)]));
      allocation = distribute(remainingMinutes, weights, history);
    }
    if (date < today) allocation = {};
    for (const [code, value] of Object.entries(allocation)) history[code] = (history[code] ?? 0) + value;
    const allocated = Object.values(allocation).reduce((sum, value) => sum + value, 0);
    days.push({ date, weekday, status: date < today ? "PAST" : available === 0 ? "DAY_OFF" : studyMinutes === 0 && simulationMinutes > 0 ? "SIMULATION_RESERVED" : remainingMinutes === 0 ? "BUDGET_USED" : "AVAILABLE",
      minutes: available, completedMinutes, remainingMinutes, studyMinutes, reviewMinutes: Math.floor(allocated * settings.reviewPercent / 100),
      simulationMinutes, unallocatedMinutes: remainingMinutes - allocated, startTime: override?.startTime ?? base.startTime,
      allocations: Object.entries(allocation).filter(([, value]) => value > 0).sort(([a], [b]) => byCode(a, b)).map(([subjectCode, minutes]) => ({ subjectCode, minutes })), warnings });
  }
  return routineWeekSchema.parse({ policyVersion: ROUTINE_POLICY, timezone: settings.timezone, today, weekStart,
    activeSessionId: context.sessions.filter(session => session.status === "ACTIVE").map(session => session.id).sort(byCode)[0] ?? null, days });
}

export function routineSessionLimits(week: RoutineWeek) {
  const today = week.days.find(day => day.date === week.today)!;
  return Object.assign(Object.create(null), Object.fromEntries(today.allocations.map(item => [item.subjectCode, item.minutes]))) as Record<string, number>;
}
