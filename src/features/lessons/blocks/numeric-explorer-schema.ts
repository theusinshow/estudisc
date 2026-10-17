import { z } from "zod";
const percentage = z.object({ mode: z.undefined().optional(), initialValue: z.number().finite().min(0).max(1000000), initialPercentage: z.number().finite().min(0).max(500) });
const label = z.string().trim().min(1).max(160);
export const linearExplorerSchema = z.object({ mode: z.literal("linear"), title: label, variableLabel: label, outputLabel: label, unit: label.optional(), outputUnit: label.optional(), min: z.number().finite().min(-1000000).max(1000000), max: z.number().finite().min(-1000000).max(1000000), step: z.number().finite().min(0.001).max(1000000), initial: z.number().finite(), slope: z.number().finite().min(-1000000).max(1000000), intercept: z.number().finite().min(-1000000).max(1000000), explanation: z.string().min(1).max(2000), integerInput: z.boolean().optional() }).superRefine((config, context) => {
  if (config.min >= config.max || config.initial < config.min || config.initial > config.max || config.step > config.max - config.min) context.addIssue({ code: "custom", message: "Invalid linear explorer range" });
  if (config.integerInput && ![config.min, config.max, config.step, config.initial].every(Number.isInteger)) context.addIssue({ code: "custom", message: "Discrete input requires integer bounds, step and initial value" });
  const ticks = (config.initial - config.min) / config.step;
  if (Math.abs(ticks - Math.round(ticks)) > 0.000001) context.addIssue({ code: "custom", message: "Initial value must match the authored step" });
});
// ADR 0070: exploratory models. They record no Attempt or evidence; the lesson's Questions still own the practice. Top-level objects are not strict because pack validation merges the block envelope into the payload.
const explanation = z.string().min(1).max(2000);
const whole = (min: number, max: number) => z.number().int().min(min).max(max);
export const percentGridSchema = z.object({ mode: z.literal("percent-grid"), title: label, initial: whole(0, 100), target: whole(0, 100).optional(), explanation });
export const numberLineSchema = z.object({
  mode: z.literal("number-line"), title: label, min: z.number().finite().min(-1000).max(1000), max: z.number().finite().min(-1000).max(1000),
  divisions: whole(2, 40), initial: whole(0, 40), target: whole(0, 40).optional(), targetLabel: label.optional(),
  ticks: z.array(z.object({ at: whole(0, 40), label: z.string().trim().min(1).max(12) }).strict()).max(41).default([]), explanation
}).superRefine((config, context) => {
  const fail = (message: string) => context.addIssue({ code: "custom", message });
  if (config.min >= config.max) fail("Number line needs min < max");
  if (config.initial > config.divisions || (config.target ?? 0) > config.divisions || config.ticks.some(tick => tick.at > config.divisions)) fail("Positions must lie on the line");
  if (config.target !== undefined && !config.targetLabel) fail("A target needs the label the student is asked to place");
});
export const equationBalanceSchema = z.object({ mode: z.literal("balance"), title: label, coefficient: whole(1, 4), constant: whole(0, 9), result: whole(1, 30), explanation })
  .superRefine((config, context) => {
    const x = (config.result - config.constant) / config.coefficient;
    if (!Number.isInteger(x) || x < 1 || x > 9) context.addIssue({ code: "custom", message: "The balance needs a whole solution from 1 to 9" });
  });
export const timeZonesSchema = z.object({
  mode: z.literal("time-zones"), title: label, initialUtc: whole(0, 23),
  places: z.array(z.object({ label: z.string().trim().min(1).max(40), offset: whole(-12, 14) }).strict()).min(2).max(6), explanation
});
export const numericExplorerSchema = z.union([percentage, linearExplorerSchema, percentGridSchema, numberLineSchema, equationBalanceSchema, timeZonesSchema]);
export type NumericExplorerConfig = z.infer<typeof numericExplorerSchema>;
