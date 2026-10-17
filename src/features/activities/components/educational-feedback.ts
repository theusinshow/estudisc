import { evaluateEducationalActivity, type EducationalActivityConfig } from "../application/educational-activity";

/** A teaching cue only: the existing evaluator/result is unchanged and no score is recorded. */
export function educationalFeedback(config: EducationalActivityConfig, response: unknown) {
  const result = evaluateEducationalActivity(config, response);
  let matched = 0, total = 1;
  let marks: Record<string, boolean> | undefined;
  if (config.type === "ordering" && Array.isArray(response)) { total = config.expectedOrder.length; marks = Object.fromEntries(config.expectedOrder.map((id, index) => [`${index}`, id === response[index]])); matched = Object.values(marks).filter(Boolean).length; }
  else if (config.type === "text-highlight" && Array.isArray(response)) { total = config.expectedIds.length; matched = config.expectedIds.filter(id => response.includes(id)).length; marks = Object.fromEntries(response.filter((id): id is string => typeof id === "string").map(id => [id, config.expectedIds.includes(id)])); }
  else if ((config.type === "matching" || config.type === "classification" || config.type === "guided-steps") && response && typeof response === "object" && !Array.isArray(response)) {
    const actual = response as Record<string, unknown>;
    if (config.type === "guided-steps") { total = config.steps.length; matched = config.steps.filter(step => Object.hasOwn(actual, step.id) && String(actual[step.id]).trim().toLocaleLowerCase("pt-BR") === String(step.expected).toLocaleLowerCase("pt-BR")).length; }
    else { total = config.items.length; marks = Object.fromEntries(config.items.map(item => [item.id, Object.hasOwn(actual, item.id) && actual[item.id] === config.expected[item.id]])); matched = Object.values(marks).filter(Boolean).length; }
  }
  return { ...result, partial: !result.correct && matched > 0, matched, total, marks };
}
