import { sessionItemsSchema } from "./contracts";
import { RoutineConflictError, type RoutineWeek } from "./routine-contracts";
import { routineSessionLimits } from "./routine-policy";

export function assertRoutineBudget(week: RoutineWeek | null, requestedMinutes: number) {
  if (!week) return undefined;
  const limits = routineSessionLimits(week);
  if (requestedMinutes > Object.values(limits).reduce((sum, value) => sum + value, 0)) throw new RoutineConflictError("routine_budget_exceeded");
  return limits;
}
export function assertRoutineStart(week: RoutineWeek | null, items: unknown) {
  if (!week) return;
  const limits = routineSessionLimits(week);
  const planned: Record<string, number> = Object.create(null);
  for (const item of sessionItemsSchema.parse(items)) planned[item.subjectCode] = (planned[item.subjectCode] ?? 0) + Math.ceil(item.minutes);
  if (Object.entries(planned).some(([code, minutes]) => minutes > (limits[code] ?? 0))) throw new RoutineConflictError("routine_budget_exceeded");
}
export function remainingRoutineMinutes(week: RoutineWeek | null) {
  return week ? Object.values(routineSessionLimits(week)).reduce((sum, value) => sum + value, 0) : undefined;
}
