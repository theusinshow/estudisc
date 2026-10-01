import { z } from "zod";

import { contentSourceSchema, curriculumRequirementSchema, conceptPrerequisiteSchema } from "@/features/curriculum/contracts";
import { questionSchema } from "@/features/questions/api";

const id = z.string().trim().min(1).max(160);
const ids = z.array(id).default([]);
const record = z.record(z.string(), z.unknown());
export const trackPackV2Schema = z.object({
  schema: z.literal("caderno.track.v2"), packId: z.string().regex(/^[a-z0-9][a-z0-9._-]{2,127}$/), version: z.number().int().positive(), language: z.string().min(2),
  sources: z.array(contentSourceSchema).default([]),
  curriculumRequirements: z.array(curriculumRequirementSchema.extend({ status: z.enum(["unmapped", "mapped", "covered", "validated"]).optional() })).default([]),
  conceptPrerequisites: z.array(conceptPrerequisiteSchema).default([]), questions: z.array(questionSchema).default([]),
  track: z.object({ id, title: z.string().min(1), description: z.string().optional(), metadata: record.default({}), modules: z.array(z.object({
    id, title: z.string().min(1), subjectCode: id,
    lessons: z.array(z.object({
      id, version: z.number().int().positive(), title: z.string().min(1), kind: z.enum(["core", "compact", "practice", "synthesis"]), estimatedMinutes: z.number().int().min(1).max(240).default(30), status: z.enum(["draft", "review", "approved", "published", "retired"]).default("draft"),
      concepts: z.array(z.object({ id, title: z.string().min(1), summary: z.string().optional(), importance: z.enum(["low", "medium", "high", "critical"]).default("medium") }).strict()).min(1),
      prerequisiteConceptIds: ids, objectives: z.array(z.string().min(1)).default([]), sourceIds: ids, exitTicketQuestionIds: ids,
      blocks: z.array(z.object({ id, type: z.enum(["text", "concept", "note", "warning", "code", "example", "prediction", "summary", "worked-example", "numeric-explorer", "guided-steps", "text-highlight", "classification", "ordering", "timeline", "diagram", "graph", "table", "map", "hotspot", "matching", "exit-ticket"]), schemaVersion: z.number().int().positive().default(1), conceptIds: ids, payload: record }).strict()),
      activities: z.array(z.object({ id, type: z.enum(["prediction", "multiple-choice", "explain", "code", "debug", "numeric", "ordering", "classification", "matching", "text-highlight", "guided-steps", "question"]), conceptIds: z.array(id).min(1), prompt: z.string().min(1), questionId: id.optional(), config: record, evaluatorVersion: z.string().optional() }).strict())
    }).strict())
  }).strict()) }).strict()
}).strict();

export type TrackPackV2 = z.infer<typeof trackPackV2Schema>;
