import { z } from "zod";
import { countsAsIndependent, confidenceSchema } from "@/features/review/confidence";
import type { SessionItem } from "./contracts";

/** ADR 0072: review and mistake practice run as blocks of up to five Questions, one at a time, with no time choice. */
export const PRACTICE_BLOCK_POLICY = "practice-block.v1";
export const PRACTICE_BLOCK_SIZE = 5;
/** Internal composition budget, never shown or chosen: wide enough for five Questions of any difficulty. */
export const PRACTICE_BLOCK_MINUTES = 60;

export const practiceBlockTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("review"), conceptId: z.string().trim().min(1).max(160).optional() }).strict(),
  z.object({ kind: z.literal("remediation"), mistakeId: z.uuid() }).strict()
]);
export type PracticeBlockTarget = z.infer<typeof practiceBlockTargetSchema>;

/** The block's target travels in policyVersion, so resuming the same target needs no migration. */
export function practiceBlockPolicy(target: PracticeBlockTarget) {
  const canonical = target.kind === "remediation" ? { kind: target.kind, mistakeId: target.mistakeId } : target.conceptId ? { kind: target.kind, conceptId: target.conceptId } : { kind: target.kind };
  return `${PRACTICE_BLOCK_POLICY}|${JSON.stringify(canonical)}`;
}

export function readPracticeBlockTarget(policyVersion: string): PracticeBlockTarget | null {
  const prefix = `${PRACTICE_BLOCK_POLICY}|`;
  if (!policyVersion.startsWith(prefix)) return null;
  try {
    const parsed = practiceBlockTargetSchema.safeParse(JSON.parse(policyVersion.slice(prefix.length)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Keeps the composed order and trims every item's parallel lists to the first `size` Questions. */
export function capBlockItems(items: readonly SessionItem[], size = PRACTICE_BLOCK_SIZE): SessionItem[] {
  const capped: SessionItem[] = [];
  let left = size;
  for (const item of items) {
    if (left <= 0) break;
    const snapshots = (item.activitySnapshots ?? []).slice(0, left);
    if (!snapshots.length) continue;
    const activityIds = new Set(snapshots.map(snapshot => snapshot.stableId));
    const questionIds = new Set(snapshots.map(snapshot => snapshot.config.questionId));
    capped.push({ ...item, activitySnapshots: snapshots, activityIds: item.activityIds.filter(id => activityIds.has(id)), questions: item.questions.filter(question => questionIds.has(question.id)) });
    left -= snapshots.length;
  }
  return capped;
}

export type BlockQuestion = Readonly<{ stableId: string; questionId: string; questionVersion: number; prompt: string; itemIndex: number }>;
export function blockQuestions(items: readonly SessionItem[]): BlockQuestion[] {
  return items.flatMap((item, itemIndex) => (item.activitySnapshots ?? []).map(snapshot => ({
    stableId: snapshot.stableId, questionId: snapshot.config.questionId, questionVersion: snapshot.config.questionVersion, prompt: snapshot.prompt, itemIndex
  })));
}

export type BlockAnswer = Readonly<{ questionId: string | null; outcome: string; hintLevel: number; solutionRevealed: boolean; confidence: string | null }>;
/** Attempt context as written by the question repositories (SQL and memory share the shape). */
export function toBlockAnswer(context: unknown, outcome: string): BlockAnswer {
  const value = (context ?? {}) as Record<string, unknown>;
  return {
    questionId: typeof value.questionId === "string" ? value.questionId : null, outcome,
    hintLevel: Number(value.hintLevel ?? 0), solutionRevealed: value.solutionRevealed === true,
    confidence: typeof value.confidence === "string" ? value.confidence : null
  };
}

export type BlockMark = "independent" | "retry" | "open";
/** Each Question counts by its first Attempt in the block: "sem ajuda" means right with no hint, no solution and no guess. */
export function summarizeBlock(questions: readonly BlockQuestion[], answers: readonly BlockAnswer[]) {
  const first = new Map<string, BlockAnswer>();
  for (const answer of answers) if (answer.questionId && !first.has(answer.questionId)) first.set(answer.questionId, answer);
  const rows = questions.map(question => {
    const answer = first.get(question.questionId);
    const confidence = confidenceSchema.safeParse(answer?.confidence);
    const mark: BlockMark = !answer ? "open"
      : answer.outcome === "passed" && countsAsIndependent({ hintLevel: answer.hintLevel, solutionRevealed: answer.solutionRevealed, confidence: confidence.success ? confidence.data : null }) ? "independent" : "retry";
    return { ...question, mark };
  });
  return { total: rows.length, answered: rows.filter(row => row.mark !== "open").length, independent: rows.filter(row => row.mark === "independent").length, rows };
}

/** The Concept every item of the block shares (remediation and single-Concept review), for the block title. */
export function blockConceptId(items: readonly SessionItem[]): string | null {
  if (!items.length) return null;
  const shared = items.map(item => item.conceptIds ?? []).reduce((left, right) => left.filter(id => right.includes(id)));
  return shared[0] ?? null;
}
