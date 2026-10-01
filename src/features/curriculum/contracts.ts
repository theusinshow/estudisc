import { z } from "zod";

const id = z.string().trim().min(1).max(160);
const record = z.record(z.string(), z.unknown());
const uniqueIds = z.array(id).refine(ids => new Set(ids).size === ids.length, "Duplicate reference");

export const contentSourceSchema = z.object({
  id,
  type: z.enum(["official_curriculum", "official_exam", "reference", "human_created", "ai_generated"]),
  title: z.string().trim().min(1),
  locator: record.default({}),
  metadata: record.default({})
}).strict();

export const curriculumRequirementSchema = z.object({
  id,
  parentId: id.optional(),
  subjectCode: id,
  label: z.string().trim().min(1),
  sourceId: id,
  sourceLocator: record.default({}),
  mappedConceptIds: uniqueIds.default([])
}).strict();

export const conceptPrerequisiteSchema = z.object({
  conceptId: id,
  prerequisiteConceptId: id,
  strength: z.enum(["required", "recommended"])
}).strict();

export const curriculumConceptSettingSchema = z.object({
  conceptId: id,
  moduleId: id,
  subjectCode: id,
  importance: z.enum(["low", "medium", "high", "critical"])
}).strict();

export const curriculumFoundationSchema = z.object({
  sources: z.array(contentSourceSchema).max(2000),
  requirements: z.array(curriculumRequirementSchema).max(5000),
  prerequisites: z.array(conceptPrerequisiteSchema).max(10000),
  settings: z.array(curriculumConceptSettingSchema).max(5000)
}).strict();

export type CurriculumFoundation = z.infer<typeof curriculumFoundationSchema>;
export type CurriculumRequirement = CurriculumFoundation["requirements"][number];
export type ConceptPrerequisite = CurriculumFoundation["prerequisites"][number];
export type CurriculumIssue = Readonly<{ code: string; path: string; message: string }>;
