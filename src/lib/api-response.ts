import { z } from "zod";

export const apiErrorSchema = z.object({ code: z.string().optional(), message: z.string().optional(), retryable: z.boolean().optional(), jobId: z.string().optional(), status: z.string().optional(), issues: z.array(z.object({ path: z.string(), message: z.string() })).optional() });
export async function readValidatedResponse<S extends z.ZodType>(response: Response, schema: S): Promise<z.output<S>> {
  const body: unknown = await response.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new Error("A resposta do servidor não segue o contrato esperado. Tente novamente.");
  return parsed.data;
}
export const sessionResponseSchema = z.object({ sessionId: z.uuid(), status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ABANDONED"]) });
export const assessmentStartResponseSchema = z.object({ id: z.uuid() });
export const recordedResponseSchema = z.object({ recorded: z.literal(true) });
export const assessmentSavedResponseSchema = z.object({ saved: z.literal(true) });
export const assessmentFinalizedResponseSchema = z.object({
  correct: z.number().int().nonnegative(),
  scored: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  policyVersion: z.string(),
  finishedAfterDeadline: z.boolean()
});
