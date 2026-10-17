/** Versioned rewards; never an input to mastery or the planner. */
export const GAMIFICATION_POLICY_VERSION = "gamification.v2";
export const QUESTION_SUCCESS_XP = 20;
export const QUESTION_SUCCESS_REASON = "question_independent_success";

export function isIndependentQuestionSuccess(conditions: Readonly<Record<string, unknown>>): boolean {
  return conditions.outcome === "passed" && conditions.hintLevel === 0 && conditions.solutionRevealed === false;
}

/** A correct answer reached after a mistake or a hint, without opening the solution: smaller, separately labeled reward. */
export const QUESTION_ASSISTED_XP = 10;
export const QUESTION_ASSISTED_REASON = "question_assisted_success";
export type QuestionReward = "first_try" | "assisted";

/** Once per stable Question; `failedBefore` counts this owner's earlier failed attempts at the Question. */
export function questionReward(conditions: Readonly<Record<string, unknown>>, failedBefore: number): QuestionReward | undefined {
  if (conditions.outcome !== "passed" || conditions.solutionRevealed !== false) return undefined;
  return failedBefore === 0 && isIndependentQuestionSuccess(conditions) ? "first_try" : "assisted";
}

/** Student words for each stored XP reason; unknown reasons fall back to a neutral label, never the code. */
const XP_REASON_LABELS: Readonly<Record<string, string>> = {
  [QUESTION_SUCCESS_REASON]: "Acertou de primeira, sem ajuda",
  [QUESTION_ASSISTED_REASON]: "Acertou depois de revisar",
  code_activity_passed: "Resolveu uma atividade de código",
  debug_activity_passed: "Corrigiu um código com erro"
};
export function xpReasonLabel(reason: string) {
  return XP_REASON_LABELS[reason] ?? "Prática registrada";
}
