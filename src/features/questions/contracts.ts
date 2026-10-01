import { z } from "zod";

const id = z.string().trim().min(1).max(160);
const uniqueIds = z.array(id).refine(values => new Set(values).size === values.length, "Duplicate IDs");
export const questionSchema = z.object({
  id, version: z.number().int().positive(), subjectCode: id,
  primaryConceptId: id, conceptIds: uniqueIds.refine(ids => ids.length > 0),
  type: z.enum(["multiple_choice", "numeric", "ordering", "classification", "matching"]),
  difficulty: z.enum(["foundation", "direct", "applied", "ifsc", "challenge"]),
  cognitiveOperations: z.array(z.enum(["recall", "identify", "interpret", "calculate", "compare", "infer", "apply", "analyze", "evaluate"])).min(1),
  stimulus: z.string().min(1).optional(), stem: z.string().min(1),
  choices: z.array(z.object({ id, content: z.string().min(1), correct: z.boolean(), targetsError: z.enum(["conceptual", "procedural", "calculation", "interpretation", "prerequisite", "distractor", "attention", "memory", "unknown"]).optional(), rationale: z.string().optional() }).strict()).optional(),
  answer: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("multiple_choice"), choiceId: id }).strict(),
    z.object({ kind: z.literal("numeric"), value: z.number().finite(), tolerance: z.number().finite().nonnegative().default(0), unit: z.string().optional() }).strict(),
    z.object({ kind: z.literal("ordering"), orderedIds: uniqueIds.refine(ids => ids.length > 0) }).strict(),
    z.object({ kind: z.literal("classification"), assignments: z.record(id, id) }).strict(),
    z.object({ kind: z.literal("matching"), pairs: z.record(id, id) }).strict()
  ]),
  explanation: z.string().min(1).optional(), sourceIds: uniqueIds.default([]),
  assets:z.array(z.object({id:z.uuid(),sourceId:id,page:z.number().int().positive(),alt:z.string().min(1),width:z.number().int().positive(),height:z.number().int().positive()}).strict()).default([]),
  items: z.array(z.object({ id, label: z.string().min(1) }).strict()).default([]),
  destinations: z.array(z.object({ id, label: z.string().min(1) }).strict()).default([]),
  provenance: z.object({ type: z.enum(["official_exam", "generated", "human_created", "derived"]), examId: id.optional(), officialNumber: z.number().int().positive().optional(), generationRunId: id.optional(), derivedFromQuestionId: id.optional() }).strict(),
  exposurePolicy: z.object({ minimumDaysBetween: z.number().int().nonnegative().default(0), maximumTrainingExposures: z.number().int().nonnegative().optional(), reservedForAssessment: z.boolean().default(false), unlockAt: z.iso.datetime().optional() }).strict().default({ minimumDaysBetween: 0, reservedForAssessment: false }),
  status: z.enum(["draft", "auto_validated", "in_review", "approved", "published", "retired", "annulled"])
}).strict().superRefine((question, context) => {
  const fail = (message: string, path: string[]) => context.addIssue({ code: "custom", message, path });
  if (question.type !== question.answer.kind) fail("Answer kind does not match Question type", ["answer"]);
  if (!question.conceptIds.includes(question.primaryConceptId)) fail("Primary Concept missing from Concept set", ["primaryConceptId"]);
  if (question.type === "multiple_choice") {
    const choices = question.choices ?? [];
    if (choices.length < 2 || new Set(choices.map(choice => choice.id)).size !== choices.length) fail("Multiple choice needs distinct choices", ["choices"]);
    if (question.status !== "annulled" && (choices.filter(choice => choice.correct).length !== 1 || question.answer.kind !== "multiple_choice" || !choices.find(choice => choice.id === (question.answer.kind === "multiple_choice" ? question.answer.choiceId : ""))?.correct)) fail("Exactly one correct choice must match the answer", ["answer"]);
  }
  if (question.provenance.type === "official_exam" && (!question.provenance.examId || !question.provenance.officialNumber)) fail("Official provenance needs exam and item number", ["provenance"]);
  if (question.provenance.type !== "official_exam" && (question.provenance.examId || question.provenance.officialNumber)) fail("Non-official item cannot carry official identity", ["provenance"]);
  if (question.provenance.type === "derived" && !question.provenance.derivedFromQuestionId) fail("Derived item needs an original reference", ["provenance"]);
  if (question.status === "annulled" && question.provenance.type !== "official_exam") fail("Only official items may be annulled", ["status"]);
  if (["ordering", "classification", "matching"].includes(question.type) && !question.items.length) fail("Interaction requires labeled items", ["items"]);
  if(new Set(question.items.map(item=>item.id)).size!==question.items.length||new Set(question.destinations.map(item=>item.id)).size!==question.destinations.length)fail("Duplicate interaction IDs",["items"]);
  if (question.type === "classification" || question.type === "matching") {
    if (!question.destinations.length) fail("Interaction requires labeled destinations", ["destinations"]);
    const expected = question.answer.kind === "classification" ? question.answer.assignments : question.answer.kind === "matching" ? question.answer.pairs : {};
    if (Object.keys(expected).length !== question.items.length || question.items.some(item => !question.destinations.some(destination => destination.id === expected[item.id]))) fail("Invalid assignments", ["answer"]);
    if(question.type==="matching"&&new Set(Object.values(expected)).size!==question.items.length)fail("Matching requires distinct destinations",["answer"]);
  }
  if (question.answer.kind === "ordering" && (question.answer.orderedIds.length !== question.items.length || question.answer.orderedIds.some(id => !question.items.some(item => item.id === id)))) fail("Invalid item order", ["answer"]);
});

export type Question = z.infer<typeof questionSchema>;
