import { and, eq, lte } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";
import { assessmentInstances, attempts, concepts, mistakes, questions, questionVersions, reviewSchedules } from "@/db/schema";
import type { MemoryStore } from "./memory/store";
import { TargetedPracticeError, type TargetedPracticeRequest, type TargetedSelection } from "@/features/study-sessions/targeted-selection";

function reviewSelection(ids: readonly string[], requested?: string): TargetedSelection {
  if (requested && !ids.includes(requested)) throw new TargetedPracticeError("review_not_due");
  return { kind: "review", conceptIds: requested ? [requested] : [...new Set(ids)], excludedQuestionIds: [], reason: "Recupere conceitos cuja revisão está prevista para agora, respondendo às questões." };
}
function remediationSelection(conceptId: string, questionId: unknown): TargetedSelection {
  if (typeof questionId !== "string" || !questionId) throw new TargetedPracticeError("question_context_unavailable");
  return { kind: "remediation", conceptIds: [conceptId], excludedQuestionIds: [questionId], reason: "Pratique outra questão do conceito ligado ao erro registrado; a nova resposta passa pelo mesmo avaliador." };
}
export async function sqlTargetedSelection(db: PgDatabase<PgQueryResultHKT, typeof schema>, ownerId: string, request: TargetedPracticeRequest, now: Date): Promise<TargetedSelection> {
  const [exam] = await db.select({ id: assessmentInstances.id }).from(assessmentInstances).where(and(eq(assessmentInstances.ownerId, ownerId), eq(assessmentInstances.status, "ACTIVE"), eq(assessmentInstances.mode, "EXAM"))).limit(1);
  if (exam) throw new TargetedPracticeError("exam_active");
  if (request.kind === "review") {
    const rows = await db.select({ id: concepts.stableId }).from(reviewSchedules).innerJoin(concepts, eq(concepts.id, reviewSchedules.conceptId)).where(and(eq(reviewSchedules.ownerId, ownerId), lte(reviewSchedules.nextReviewAt, now)));
    return reviewSelection(rows.map(r => r.id), request.conceptId);
  }
  const [row] = await db.select({ conceptId: concepts.stableId, questionId: questions.stableId }).from(mistakes)
    .innerJoin(attempts, and(eq(attempts.id, mistakes.attemptId), eq(attempts.ownerId, ownerId)))
    .innerJoin(concepts, eq(concepts.id, mistakes.conceptId)).leftJoin(questionVersions, eq(questionVersions.id, attempts.questionVersionId)).leftJoin(questions, eq(questions.id, questionVersions.questionId))
    .where(and(eq(mistakes.id, request.mistakeId), eq(mistakes.ownerId, ownerId), eq(mistakes.status, "active"))).limit(1);
  if (!row) throw new TargetedPracticeError("target_unavailable");
  return remediationSelection(row.conceptId, row.questionId);
}
export function memoryTargetedSelection(store: MemoryStore, ownerId: string, request: TargetedPracticeRequest, now: Date): TargetedSelection {
  if (store.assessmentInstances.some(a => a.ownerId === ownerId && a.status === "ACTIVE" && a.snapshot.mode === "EXAM")) throw new TargetedPracticeError("exam_active");
  if (request.kind === "review") return reviewSelection(store.reviewSchedules.filter(r => r.ownerId === ownerId && r.nextReviewAt <= now).map(r => r.conceptStableId), request.conceptId);
  const mistake = store.mistakes.find(m => m.ownerId === ownerId && m.id === request.mistakeId && m.status === "active");
  const attempt = mistake && store.attempts.find(a => a.ownerId === ownerId && a.id === mistake.attemptId);
  if (!mistake || !attempt) throw new TargetedPracticeError("target_unavailable");
  return remediationSelection(mistake.conceptStableId, attempt.context?.questionId);
}
