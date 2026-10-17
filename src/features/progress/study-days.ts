import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";

/** The one calendar for study days on Hoje, Progresso and conquistas. */
export const STUDY_TIME_ZONE = "America/Sao_Paulo";

/**
 * A study day is a day with at least one answered question. One answer can emit evidence for several
 * Concepts, so each Attempt counts once; self-ratings and diagnostic seeds are not answers.
 */
export function answeredQuestions(evidence: readonly ConceptEvidenceRecord[], now: Date) {
  return [...new Map(evidence.filter(item =>
    item.attemptId && typeof item.conditions.questionId === "string" &&
    ["question_result", "assessment_result"].includes(item.type) &&
    ["passed", "failed"].includes(String(item.conditions.outcome)) && item.createdAt <= now
  ).map(item => [item.attemptId!, item])).values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function studyDayKey(date: Date, timeZone = STUDY_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Consecutive study days ending today, or yesterday when today has no answer yet (the day is not over). */
export function studyStreak(dayKeys: ReadonlySet<string>, now: Date, timeZone = STUDY_TIME_ZONE) {
  const cursor = new Date(`${studyDayKey(now, timeZone)}T00:00:00Z`);
  if (!dayKeys.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) { streak += 1; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  return streak;
}
