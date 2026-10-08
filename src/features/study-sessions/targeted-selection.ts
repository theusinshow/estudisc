export type TargetedPracticeRequest =
  | Readonly<{ kind: "review"; conceptId?: string }>
  | Readonly<{ kind: "remediation"; mistakeId: string }>;

/** Internal constraints resolved from owned schedules/Attempts, never trusted from client IDs. */
export type TargetedSelection = Readonly<{
  kind: "review" | "remediation";
  conceptIds: readonly string[];
  excludedQuestionIds: readonly string[];
  reason: string;
}>;

export class TargetedPracticeError extends Error {
  constructor(public readonly code: "target_unavailable" | "review_not_due" | "question_context_unavailable" | "exam_active") { super(code); }
}
