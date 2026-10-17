/**
 * Exam pace (ADR 0069, lab 9.2): compares saved answers with the even pace the exam allows
 * (total time ÷ questions). Positive minutes = ahead. A ±3 min band counts as "on pace".
 */
export type ExamPace = Readonly<{ status: "ahead" | "on" | "behind"; minutes: number; perQuestionMinutes: number }>;

export function examPace({ totalQuestions, answered, startedAt, deadlineAt, now }: Readonly<{
  totalQuestions: number; answered: number; startedAt: string; deadlineAt: string; now: number;
}>): ExamPace | null {
  const start = Date.parse(startedAt), end = Date.parse(deadlineAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || totalQuestions <= 0) return null;
  const perQuestionMinutes = (end - start) / 60000 / totalQuestions;
  const elapsedMinutes = Math.max(0, (Math.min(now, end) - start) / 60000);
  const minutes = Math.round(answered * perQuestionMinutes - elapsedMinutes);
  return { status: minutes >= 3 ? "ahead" : minutes <= -3 ? "behind" : "on", minutes, perQuestionMinutes };
}

export function examPaceLabel(pace: ExamPace) {
  if (pace.status === "on") return "No ritmo";
  const n = Math.abs(pace.minutes);
  return `${n} min ${pace.status === "ahead" ? "adiantado" : "atrasado"}`;
}
