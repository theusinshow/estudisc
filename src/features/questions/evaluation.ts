import type { Question } from "./contracts";

export const QUESTION_EVALUATOR_VERSION = "question.v1";
export function evaluateQuestion(question: Question, response: unknown) {
  if (question.status === "annulled") return { outcome: "annulled" as const, correct: false, score: 0, evidenceEligible: false };
  const answer = question.answer;
  let correct = false;
  if (answer.kind === "numeric") {
    const raw = typeof response === "number" ? response : typeof response === "string" && /^[-+]?\d+(?:[.,]\d+)?$/.test(response.trim()) ? Number(response.trim().replace(",", ".")) : NaN;
    correct = Number.isFinite(raw) && Math.abs(raw - answer.value) <= answer.tolerance;
  } else if (answer.kind === "multiple_choice") correct = response === answer.choiceId;
  else if (answer.kind === "ordering") correct = Array.isArray(response) && JSON.stringify(response) === JSON.stringify(answer.orderedIds);
  else if (response && typeof response === "object" && !Array.isArray(response)) {
    const expected = answer.kind === "classification" ? answer.assignments : answer.pairs;
    const actual = response as Record<string, unknown>;
    correct = Object.keys(actual).length === Object.keys(expected).length && Object.entries(expected).every(([key, value]) => actual[key] === value);
  }
  return { outcome: correct ? "passed" as const : "failed" as const, correct, score: correct ? 1 : 0, evidenceEligible: true };
}
