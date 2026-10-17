/** startNew: the learner chose to leave an open session and start this practice from step 1. */
export type TargetedPracticeRequest =
  | Readonly<{ kind: "review"; conceptId?: string; startNew?: boolean }>
  | Readonly<{ kind: "remediation"; mistakeId: string; startNew?: boolean }>;

/** Internal constraints resolved from owned schedules/Attempts, never trusted from client IDs. */
export type TargetedSelection = Readonly<{
  kind: "review" | "remediation";
  conceptIds: readonly string[];
  excludedQuestionIds: readonly string[];
  reason: string;
}>;

/** A targeted practice never silently reuses another open session; the learner chooses to continue it or start anew. */
export class OpenSessionError extends Error {
  constructor(public readonly sessionId: string) { super("session_open"); }
}

export class TargetedPracticeError extends Error {
  constructor(public readonly code: "target_unavailable" | "review_not_due" | "question_context_unavailable" | "exam_active") { super(code); }
}
