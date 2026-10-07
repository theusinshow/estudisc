import { z } from "zod";
const percentage = z.object({ mode: z.undefined().optional(), initialValue: z.number().finite().min(0).max(1000000), initialPercentage: z.number().finite().min(0).max(500) });
const label = z.string().trim().min(1).max(160);
export const linearExplorerSchema = z.object({ mode: z.literal("linear"), title: label, variableLabel: label, outputLabel: label, unit: label.optional(), outputUnit: label.optional(), min: z.number().finite().min(-1000000).max(1000000), max: z.number().finite().min(-1000000).max(1000000), step: z.number().finite().min(0.001).max(1000000), initial: z.number().finite(), slope: z.number().finite().min(-1000000).max(1000000), intercept: z.number().finite().min(-1000000).max(1000000), explanation: z.string().min(1).max(2000) }).superRefine((config, context) => {
  if (config.min >= config.max || config.initial < config.min || config.initial > config.max || config.step > config.max - config.min) context.addIssue({ code: "custom", message: "Invalid linear explorer range" });
  const ticks = (config.initial - config.min) / config.step;
  if (Math.abs(ticks - Math.round(ticks)) > 0.000001) context.addIssue({ code: "custom", message: "Initial value must match the authored step" });
});
export const numericExplorerSchema = z.union([percentage, linearExplorerSchema]);
export type NumericExplorerConfig = z.infer<typeof numericExplorerSchema>;
