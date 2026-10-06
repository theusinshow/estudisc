/** Versioned rewards; never an input to mastery or the planner. */
export const GAMIFICATION_POLICY_VERSION = "gamification.v2";
export const QUESTION_SUCCESS_XP = 20;
export const QUESTION_SUCCESS_REASON = "question_independent_success";

export function isIndependentQuestionSuccess(conditions: Readonly<Record<string, unknown>>): boolean {
  return conditions.outcome === "passed" && conditions.hintLevel === 0 && conditions.solutionRevealed === false;
}
