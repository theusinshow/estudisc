import { evaluateEducationalActivity, type EducationalActivityConfig } from "../application/educational-activity";

/** A teaching cue only: the existing evaluator/result is unchanged and no score is recorded. */
export function educationalFeedback(config: EducationalActivityConfig, response: unknown) {
  const result = evaluateEducationalActivity(config, response);
  let matched = 0, total = 1;
  if (config.type === "ordering" && Array.isArray(response)) { total = config.expectedOrder.length; matched = config.expectedOrder.filter((id, index) => id === response[index]).length; }
  else if (config.type === "text-highlight" && Array.isArray(response)) { total = config.expectedIds.length; matched = config.expectedIds.filter(id => response.includes(id)).length; }
  else if ((config.type === "matching" || config.type === "classification" || config.type === "guided-steps") && response && typeof response === "object" && !Array.isArray(response)) {
    const actual = response as Record<string, unknown>;
    if (config.type === "guided-steps") { total = config.steps.length; matched = config.steps.filter(step => Object.hasOwn(actual, step.id) && String(actual[step.id]).trim().toLocaleLowerCase("pt-BR") === String(step.expected).toLocaleLowerCase("pt-BR")).length; }
    else { total = config.items.length; matched = config.items.filter(item => Object.hasOwn(actual, item.id) && actual[item.id] === config.expected[item.id]).length; }
  }
  return { ...result, partial: !result.correct && matched > 0, matched, total };
}
