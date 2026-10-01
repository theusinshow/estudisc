import { educationalActivitySchema, type EducationalActivityConfig } from "@/features/activities/application/educational-activity";
import type { Question } from "./contracts";

export function questionInteraction(question: Question, hints: readonly string[] = []): EducationalActivityConfig {
  const common = { hints: [...hints], explanation: question.explanation ?? "" };
  const answer = question.answer;
  if (answer.kind === "numeric") return educationalActivitySchema.parse({ ...common, type: "numeric", expected: answer.value, tolerance: answer.tolerance });
  if (answer.kind === "multiple_choice") return educationalActivitySchema.parse({ ...common, type: "multiple-choice", items: (question.choices ?? []).map(choice => ({ id: choice.id, label: choice.content })), expectedChoice: answer.choiceId });
  if (answer.kind === "ordering") return educationalActivitySchema.parse({ ...common, type: "ordering", items: question.items, expectedOrder: answer.orderedIds });
  return educationalActivitySchema.parse({ ...common, type: answer.kind, items: question.items, destinations: question.destinations, expected: answer.kind === "classification" ? answer.assignments : answer.pairs });
}
