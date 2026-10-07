import { z } from "zod";
import { parseNumericResponse } from "./numeric-response";

const item = z.object({ id: z.string().min(1), label: z.string().min(1) }).strict();
const items = z.array(item).min(1).max(60).refine(values => new Set(values.map(item => item.id)).size === values.length, "Duplicate item ID");
export const exploratoryAssistanceSchema = z.object({ hint: z.string().min(1).max(2000), recall: z.string().min(1).max(2000), analogousExample: z.string().min(1).max(2000), walkthrough: z.string().min(1).max(2000) }).strict();
const base = z.object({ instructions: z.string().optional(), hints: z.array(z.string().min(1)).max(3).default([]), explanation: z.string().default(""), assistance: exploratoryAssistanceSchema.optional() });
export const educationalActivitySchema = z.discriminatedUnion("type", [
  base.extend({ type: z.literal("multiple-choice"), items, expectedChoice: z.string().min(1) }),
  base.extend({ type: z.literal("numeric"), expected: z.number().finite(), tolerance: z.number().finite().nonnegative().default(0) }),
  base.extend({ type: z.literal("ordering"), items, expectedOrder: z.array(z.string()).min(1) }),
  base.extend({ type: z.literal("classification"), items, destinations: items, expected: z.record(z.string(), z.string()) }),
  base.extend({ type: z.literal("matching"), items, destinations: items, expected: z.record(z.string(), z.string()) }),
  base.extend({ type: z.literal("text-highlight"), items, expectedIds: z.array(z.string()).min(1) }),
  base.extend({ type: z.literal("guided-steps"), steps: z.array(z.object({ id: z.string().min(1), prompt: z.string().min(1), expected: z.union([z.string().min(1), z.number().finite()]) }).strict()).min(1).max(20) })
]).superRefine((config, context) => {
  const fail = (message: string) => context.addIssue({ code: "custom", message });
  if (config.type === "multiple-choice" && !config.items.some(item => item.id === config.expectedChoice)) fail("Expected choice does not exist");
  if (config.type === "ordering" && (config.expectedOrder.length !== config.items.length || new Set(config.expectedOrder).size !== config.items.length || config.expectedOrder.some(id => !config.items.some(item => item.id === id)))) fail("Order must contain each item exactly once");
  if (config.type === "text-highlight" && (new Set(config.expectedIds).size !== config.expectedIds.length || config.expectedIds.some(id => !config.items.some(item => item.id === id)))) fail("Invalid evidence segment");
  if (config.type === "classification" || config.type === "matching") {
    if (Object.keys(config.expected).length !== config.items.length || config.items.some(item => !config.destinations.some(destination => destination.id === config.expected[item.id]))) fail("Assignment must cover all items and use valid destinations");
    if (config.type === "matching" && new Set(Object.values(config.expected)).size !== config.items.length) fail("Matching requires one-to-one pairs");
  }
  if (config.type === "guided-steps" && new Set(config.steps.map(step => step.id)).size !== config.steps.length) fail("Duplicate step ID");
});
export type EducationalActivityConfig = z.infer<typeof educationalActivitySchema>;
export function parseEducationalActivityConfig(input: unknown) { return educationalActivitySchema.parse(input); }
export function evaluateEducationalActivity(config: EducationalActivityConfig, response: unknown) {
  let correct = false;
  if (config.type === "multiple-choice") correct = response === config.expectedChoice;
  else if (config.type === "numeric") {
    const raw = parseNumericResponse(response);
    correct = Number.isFinite(raw) && Math.abs(raw - config.expected) <= config.tolerance;
  } else if (config.type === "ordering") correct = JSON.stringify(response) === JSON.stringify(config.expectedOrder);
  else if (config.type === "text-highlight") correct = Array.isArray(response) && response.every(id => typeof id === "string") && JSON.stringify([...response].sort()) === JSON.stringify([...config.expectedIds].sort());
  else if (response && typeof response === "object" && !Array.isArray(response)) {
    const actual = response as Record<string, unknown>;
    if (config.type === "guided-steps") correct = Object.keys(actual).length === config.steps.length && config.steps.every(step => String(actual[step.id]).trim().toLocaleLowerCase("pt-BR") === String(step.expected).toLocaleLowerCase("pt-BR"));
    else correct = Object.keys(actual).length === config.items.length && config.items.every(item => actual[item.id] === config.expected[item.id]);
  }
  return { correct, outcome: correct ? "passed" as const : "failed" as const, evaluatorVersion: "educational.v1", errorCategory: correct ? null : config.type === "numeric" ? "CALCULATION" : config.type === "text-highlight" ? "INTERPRETATION" : "CONCEPTUAL" };
}
