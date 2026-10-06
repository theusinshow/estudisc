import { z } from "zod";

export const ROUTINE_POLICY = "routine.v1";
export const ROUTINE_PREVIEW_TTL_MS = 15 * 60_000;
export const calendarDateSchema = z.iso.date();
const weekday = z.number().int().min(0).max(6);
const minutes = z.number().int().min(0).max(240);
const subjectCode = z.string().trim().min(1).max(160);
const startTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional();
const timezone = z.string().min(1).max(100).refine(value => {
  if (/^[+-]/.test(value)) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
}, "Fuso horário inválido.");

export const routineSettingsSchema = z.object({
  timezone,
  mode: z.enum(["AUTOMATIC", "ASSISTED", "MANUAL"]),
  days: z.array(z.object({ weekday, minutes, startTime }).strict()).length(7),
  subjects: z.array(z.object({ code: subjectCode, priority: z.enum(["low", "normal", "high"]) }).strict()).min(1).max(20),
  manualAllocations: z.array(z.object({ weekday, subjectCode, minutes: minutes.refine(value => value > 0) }).strict()).max(140).default([]),
  overrides: z.array(z.object({ date: calendarDateSchema, minutes, startTime }).strict()).max(60).default([]),
  focus: z.object({ subjectCode, from: calendarDateSchema, until: calendarDateSchema }).strict().optional(),
  reviewPercent: z.number().int().min(0).max(50).default(20),
  simulation: z.object({ weekday, minutes: z.number().int().min(15).max(240) }).strict().optional()
}).strict().superRefine((settings, context) => {
  const issue = (message: string) => context.addIssue({ code: "custom", message });
  if (new Set(settings.days.map(day => day.weekday)).size !== 7) issue("Defina cada dia da semana uma única vez.");
  if (new Set(settings.subjects.map(subject => subject.code)).size !== settings.subjects.length) issue("Não repita matérias.");
  if (new Set(settings.overrides.map(override => override.date)).size !== settings.overrides.length) issue("Defina uma única mudança por data.");
  const codes = new Set(settings.subjects.map(subject => subject.code));
  if (settings.focus && (!codes.has(settings.focus.subjectCode) || settings.focus.from > settings.focus.until)) issue("Confira a matéria e as datas do foco temporário.");
  if (settings.mode === "MANUAL" && settings.focus) issue("No modo manual, ajuste o tempo de cada matéria diretamente.");
  const keys = settings.manualAllocations.map(item => `${item.weekday}:${item.subjectCode}`);
  if (new Set(keys).size !== keys.length || settings.manualAllocations.some(item => !codes.has(item.subjectCode))) issue("Confira as matérias e evite repetir alocações manuais.");
  for (const day of settings.days) {
    if (day.startTime) {
      const [hour, minute] = day.startTime.split(":").map(Number);
      if (hour * 60 + minute + day.minutes > 1440) issue("O horário sugerido e a duração devem caber no mesmo dia.");
    }
    const reserved = settings.simulation?.weekday === day.weekday ? settings.simulation.minutes : 0;
    if (reserved > day.minutes) issue("A reserva de simulado precisa caber no tempo do dia.");
    if (settings.mode === "MANUAL" && settings.manualAllocations.filter(item => item.weekday === day.weekday).reduce((sum, item) => sum + item.minutes, 0) > day.minutes - reserved) issue("As matérias ultrapassam o tempo disponível no dia.");
  }
  for (const override of settings.overrides) {
    const effectiveStart = override.startTime ?? settings.days.find(day => day.weekday === new Date(`${override.date}T12:00:00Z`).getUTCDay())?.startTime;
    if (!effectiveStart) continue;
    const [hour, minute] = effectiveStart.split(":").map(Number);
    if (hour * 60 + minute + override.minutes > 1440) issue("Confira o horário da mudança temporária.");
  }
});

export type RoutineSettings = z.infer<typeof routineSettingsSchema>;
export function routineValidationMessage(error: z.ZodError) {
  return error.issues.find(issue => issue.code === "custom")?.message ?? "Confira os dias, o tempo e as matérias da rotina.";
}
export const routineDaySchema = z.object({
  date: calendarDateSchema, weekday, status: z.enum(["PAST", "DAY_OFF", "AVAILABLE", "BUDGET_USED", "SIMULATION_RESERVED"]),
  minutes, completedMinutes: z.number().int().nonnegative(), remainingMinutes: minutes,
  studyMinutes: minutes, reviewMinutes: minutes, simulationMinutes: minutes, unallocatedMinutes: minutes,
  startTime,
  allocations: z.array(z.object({ subjectCode, minutes }).strict()),
  warnings: z.array(z.enum(["SIMULATION_DOES_NOT_FIT", "MANUAL_ALLOCATION_CAPPED"]))
}).strict();
export const routineWeekSchema = z.object({
  policyVersion: z.literal(ROUTINE_POLICY), timezone, today: calendarDateSchema, weekStart: calendarDateSchema,
  activeSessionId: z.uuid().nullable(), days: z.array(routineDaySchema).length(7)
}).strict();
export type RoutineWeek = z.infer<typeof routineWeekSchema>;
export const routineRecordSchema = z.object({ revision: z.number().int().positive(), settings: routineSettingsSchema, updatedAt: z.iso.datetime() }).strict();
export type RoutineRecord = z.infer<typeof routineRecordSchema>;
export const routineStateSchema = z.object({
  routine: routineRecordSchema.nullable(),
  subjects: z.array(z.object({ code: subjectCode, title: z.string() }).strict()),
  week: routineWeekSchema.nullable()
}).strict();
export type RoutineState = z.infer<typeof routineStateSchema>;
export const routinePreviewSchema = z.object({
  id: z.uuid(), baseRevision: z.number().int().nonnegative(), settings: routineSettingsSchema,
  week: routineWeekSchema, expiresAt: z.iso.datetime()
}).strict();
export type RoutinePreview = z.infer<typeof routinePreviewSchema>;
export const routineRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("preview"), baseRevision: z.number().int().nonnegative(), settings: routineSettingsSchema }).strict(),
  z.object({ action: z.literal("apply"), previewId: z.uuid() }).strict()
]);

export class RoutineConflictError extends Error {
  constructor(public readonly code: "stale_preview" | "expired_preview" | "invalid_subject" | "routine_budget_exceeded" | "preview_not_found") { super(code); }
}
