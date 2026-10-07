import { createHash } from "node:crypto";
import { sessionItemsSchema } from "./contracts";
import { ROUTINE_POLICY, type RoutineSettings } from "./routine-contracts";
import { addCalendarDays, calendarWeekday, localDate, type RoutineContext } from "./routine-policy";

/** Hash only time-allocation dependencies, not questions, private source bytes or mastery. */
export function routineDependencyHash(settings: RoutineSettings, context: RoutineContext, now: Date) {
  const today = localDate(now, settings.timezone);
  const weekStart = addCalendarDays(today, -((calendarWeekday(today) + 6) % 7));
  const sessions = context.sessions.filter(session => session.status === "ACTIVE" || (session.status === "COMPLETED" && session.endedAt && localDate(session.endedAt, settings.timezone) >= weekStart && localDate(session.endedAt, settings.timezone) <= today))
    .map(session => ({ id: session.id, status: session.status, endedAt: session.endedAt?.toISOString() ?? null,
      minutes: sessionItemsSchema.parse(session.items).map(item => ({ subjectCode: item.subjectCode, minutes: item.minutes })) }))
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return createHash("sha256").update(JSON.stringify({ policyVersion: ROUTINE_POLICY, today, subjectCodes: [...new Set(context.subjectCodes)].sort(), sessions })).digest("hex");
}
