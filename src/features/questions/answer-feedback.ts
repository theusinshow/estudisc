import type { Question } from "./contracts";

/** The worked solution opens on its own after this many failed attempts at the same Question. */
export const SOLUTION_AFTER_FAILURES = 2;

export type ItemResult = { itemId: string; correct: boolean };
export type AnswerKey =
  | { kind: "multiple_choice"; choiceId: string }
  | { kind: "numeric"; value: number; unit?: string }
  | { kind: "ordering"; orderedIds: string[] }
  | { kind: "classification" | "matching"; pairs: Record<string, string> };

/** Per-item marks for interactions with several parts; the expected value stays hidden until the solution opens. */
export function itemResults(question: Question, response: unknown): ItemResult[] | undefined {
  const answer = question.answer;
  if (answer.kind === "ordering") {
    const actual = Array.isArray(response) ? response : [];
    return answer.orderedIds.map((itemId, index) => ({ itemId, correct: actual[index] === itemId }));
  }
  if (answer.kind !== "classification" && answer.kind !== "matching") return undefined;
  const expected = answer.kind === "classification" ? answer.assignments : answer.pairs;
  const actual = response && typeof response === "object" && !Array.isArray(response) ? response as Record<string, unknown> : {};
  return Object.entries(expected).map(([itemId, destinationId]) => ({ itemId, correct: actual[itemId] === destinationId }));
}

export function answerKey(question: Question): AnswerKey {
  const answer = question.answer;
  if (answer.kind === "classification") return { kind: "classification", pairs: answer.assignments };
  if (answer.kind === "matching") return { kind: "matching", pairs: answer.pairs };
  if (answer.kind === "numeric") return { kind: "numeric", value: answer.value, unit: answer.unit };
  return answer;
}

/** What a wrong answer teaches: why the chosen option fails, which parts were right and, from the second failure, the solution. */
export function wrongAnswerFeedback(question: Question, response: unknown, failures: number) {
  const chosen = question.type === "multiple_choice" ? question.choices?.find(choice => choice.id === response) : undefined;
  const solutionShown = failures >= SOLUTION_AFTER_FAILURES;
  return {
    choiceFeedback: chosen?.rationale?.trim() || undefined,
    itemResults: itemResults(question, response),
    solutionShown,
    explanation: solutionShown ? question.explanation : undefined,
    answerKey: solutionShown ? answerKey(question) : undefined
  };
}
