import { z } from "zod";
import { questionSchema, type Question } from "./contracts";

/**
 * Standalone assessment Questions (ADR 0065): shared versioned Questions that belong to no
 * lesson/activity, so learners meet them for the first time inside a simulado.
 */
const stableId = z.string().trim().min(1).max(160);

export function standaloneQuestionIssues(question: Question): string[] {
  const issues: string[] = [];
  if (question.provenance.type === "official_exam") issues.push("official_provenance");
  if (question.exposurePolicy.reservedForAssessment) issues.push("reserved_for_assessment");
  if (question.status !== "draft") issues.push("not_draft");
  if (question.assets.length) issues.push("assets_unsupported");
  return issues;
}

export const standaloneQuestionSetSchema = z.object({
  trackId: stableId,
  questions: z.array(questionSchema).min(1).max(300)
}).strict().superRefine((input, context) => {
  const keys = input.questions.map(question => question.id);
  if (new Set(keys).size !== keys.length) context.addIssue({ code: "custom", message: "Each standalone Question appears once per set", path: ["questions"] });
  input.questions.forEach((question, index) => {
    const issues = standaloneQuestionIssues(question);
    if (issues.length) context.addIssue({ code: "custom", message: `Standalone Question ${question.id} refused: ${issues.join(",")}`, path: ["questions", index] });
  });
});

export const standaloneQuestionPublicationSchema = z.object({
  questions: z.array(z.object({ id: stableId, version: z.number().int().positive() }).strict()).min(1).max(300)
    .refine(refs => new Set(refs.map(ref => ref.id)).size === refs.length, "Select each Question once, with an explicit version"),
  reason: z.string().trim().min(20).max(3000)
}).strict();

export type StandaloneQuestionSet = z.infer<typeof standaloneQuestionSetSchema>;
export type StandaloneQuestionPublication = z.infer<typeof standaloneQuestionPublicationSchema>;
