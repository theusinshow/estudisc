import { z } from "zod";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { questionSchema } from "@/features/questions/contracts";
import { contentSourceSchema, curriculumRequirementSchema, conceptPrerequisiteSchema } from "@/features/curriculum/contracts";

const id = z.string().trim().min(1).max(160);
const ids = z.array(id).refine(v => new Set(v).size === v.length, "Duplicate reference");
const text = z.string().trim().min(1);
const date = z.iso.datetime();
const url = z.url().refine(v => /^https?:\/\//.test(v), "Use an HTTP(S) URL");
export const hashesSchema = z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/));
export const lessonSchema = trackPackV2Schema.shape.track.shape.modules.element.shape.lessons.element;
export const questionSetSchema = z.object({ questions: z.array(questionSchema) }).strict();
export const catalogSchema = z.object({
  origin: text, sha256: z.string(), sourceScopeVerified: z.boolean(),
  track: z.object({ id, title: text }).strict(),
  modules: z.array(z.object({ id, title: text, subjectCode: id, lessons: z.array(lessonSchema) }).strict()),
  requirements: z.array(curriculumRequirementSchema), sources: z.array(contentSourceSchema), prerequisites: z.array(conceptPrerequisiteSchema).default([]),
  historicalQuestions: z.array(z.object({ id, version: z.number().int().positive(), subjectCode: id, examId: id.optional(), officialNumber: z.number().int().positive().optional(),
    difficulty: questionSchema.shape.difficulty, cognitiveOperations: questionSchema.shape.cognitiveOperations,
    provenance: z.enum(["official_exam", "generated", "human_created", "derived"]), reserved: z.boolean(), status: text, conceptIds: ids }).strict())
}).strict();
export const lessonGenerationRequestSchema = z.object({
  schemaVersion: z.literal(1), jobId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/),
  namespace: z.enum(["estudisc", "vecta"]).optional(),
  lessonId: id, title: text, subjectCode: id, moduleId: id, conceptIds: ids.min(1), prerequisiteConceptIds: ids,
  curriculumRequirementIds: ids, objectives: z.array(text).min(1), target: text, audience: text,
  exitTicketRequired: z.boolean().default(true), maxRevisions: z.number().int().min(0).max(10).default(3),
  lessonVersion: z.number().int().positive(), packVersion: z.number().int().positive().default(1),
  demo: z.boolean().default(false)
}).strict();
export const sourceSchema = z.object({
  content: contentSourceSchema, organization: text, url: url.optional(), verifiedAt: date.optional(),
  verification: z.enum(["VERIFIED", "RESEARCH_REQUIRED"]), notes: text
}).strict().superRefine((s, c) => {
  if (s.verification === "VERIFIED" && !s.verifiedAt) c.addIssue({ code: "custom", message: "Verified source needs timestamp" });
  if (s.content.type === "reference" && s.verification === "VERIFIED" && !s.url) c.addIssue({ code: "custom", message: "Verified reference needs URL" });
});
export const sourcePackSchema = z.object({
  sources: z.array(sourceSchema),
  assertions: z.array(z.object({ id, kind: z.enum(["FACT", "INFERENCE", "EDITORIAL_RECOMMENDATION"]), statement: text, sourceIds: ids }).strict()),
  unresolved: z.array(z.object({ id, status: z.literal("RESEARCH_REQUIRED"), message: text, blocking: z.boolean() }).strict())
}).strict();
export const licenseStatusSchema = z.enum(["APPROVED_EMBED", "LINK_ONLY", "REQUIRES_REVIEW", "UNKNOWN", "REJECTED"]);
export const imageCandidateSchema = z.object({
  id, title: text, sourceType: z.enum(["EXTERNAL", "GENERATED", "HUMAN_CREATED"]), sourceUrl: url.optional(), sourceOrganization: text,
  author: text.optional(), license: text, attribution: text, licenseStatus: licenseStatusSchema,
  recommendedUse: text, altTextDraft: text, verifiedAt: date.optional(), generationPrompt: text.optional(),
  src: text.optional()
}).strict().superRefine((m, c) => {
  if (m.sourceType === "EXTERNAL" && !m.sourceUrl) c.addIssue({ code: "custom", message: "External image needs source URL" });
  if (m.sourceType === "GENERATED" && !m.generationPrompt) c.addIssue({ code: "custom", message: "Generated image needs prompt/specification" });
  if (m.licenseStatus === "APPROVED_EMBED" && !m.verifiedAt) c.addIssue({ code: "custom", message: "Approved embed needs verification timestamp" });
});
export const videoCandidateSchema = z.object({
  id, title: text, creator: text, url, durationSeconds: z.number().positive(), startSeconds: z.number().nonnegative().default(0),
  endSeconds: z.number().positive().optional(), conceptIds: ids.min(1), levelFit: text, reason: text,
  verifiedAt: date.optional(), status: z.enum(["RECOMMENDED", "REQUIRES_REVIEW", "REJECTED"])
}).strict().superRefine((v, c) => {
  if (v.startSeconds >= v.durationSeconds || (v.endSeconds !== undefined && (v.endSeconds <= v.startSeconds || v.endSeconds > v.durationSeconds))) c.addIssue({ code: "custom", message: "Invalid video timestamps" });
  if (v.status === "RECOMMENDED" && !v.verifiedAt) c.addIssue({ code: "custom", message: "Recommended video must be verified" });
});
export const bookRecommendationSchema = z.object({
  id, title: text, author: text, publisher: text, edition: text.optional(), year: z.number().int().positive().optional(),
  chapter: text.optional(), topic: text, pages: text.optional(), reason: text, url: url.optional(), supplemental: z.literal(true)
}).strict();
export const mediaPackSchema = z.object({ images: z.array(imageCandidateSchema), videos: z.array(videoCandidateSchema), books: z.array(bookRecommendationSchema) }).strict();
export const phases = ["RETRIEVAL", "HOOK", "EXPLANATION", "VISUAL", "WORKED_EXAMPLE", "GUIDED_PRACTICE", "EXPLORATION", "INDEPENDENT_PRACTICE", "TRANSFER", "IFSC_STYLE", "EXIT_TICKET", "SUMMARY"] as const;
export const lessonArchitectureSchema = z.object({
  summary: text,
  sequence: z.array(z.object({ id, phase: z.enum(phases), targetIds: ids.min(1), sourceIds: ids, mediaIds: ids }).strict()).min(1),
  provenance: z.array(z.object({ targetId: id, sourceIds: ids, mediaIds: ids, factual: z.boolean() }).strict())
}).strict();
export const unsupportedComponentRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("UNSUPPORTED_COMPONENT_REQUEST"), proposedComponentType: text, pedagogicalReason: text, reusableLessons: ids, minimalBehavior: text }).strict(),
  z.object({ type: z.literal("GENERATED_IMAGE_REQUEST"), purpose: text, conceptIds: ids.min(1), prompt: text, styleConstraints: text, requiredLabels: z.array(text), altTextDraft: text }).strict()
]);
export const unsupportedComponentsSchema = z.object({ requests: z.array(unsupportedComponentRequestSchema) }).strict();
export const categories = ["STRUCTURAL", "FACTUAL", "PEDAGOGICAL", "IFSC_ALIGNMENT", "MEDIA", "COPYRIGHT", "ACCESSIBILITY"] as const;
export const qaFindingSchema = z.object({ id, severity: z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]), category: z.enum(categories), target: id, message: text, evidence: text, requiredFix: text }).strict();
export const qaReportSchema = z.object({
  decision: z.enum(["APPROVED", "NEEDS_REVISION", "REJECTED"]), summary: text, reviewerId: id,
  inputHashes: hashesSchema, dimensions: z.array(z.enum(categories)).refine(v => new Set(v).size === categories.length, "Review all seven dimensions"),
  findings: z.array(qaFindingSchema).refine(v => new Set(v.map(f => f.id)).size === v.length, "Duplicate finding IDs")
}).strict();
export const statuses = ["NEW", "RESEARCH_READY", "RESEARCH_IN_PROGRESS", "RESEARCH_DONE", "AUTHOR_READY", "AUTHOR_IN_PROGRESS", "DRAFT_DONE", "VALIDATION", "REVIEW_READY", "REVIEW_IN_PROGRESS", "NEEDS_REVISION", "REVISION_IN_PROGRESS", "APPROVED", "IMPORT_READY", "HUMAN_REVIEW_REQUIRED"] as const;
export const roleSchema = z.enum(["ORCHESTRATOR", "RESEARCHER", "AUTHOR", "REVIEWER"]);
export const runSchema = z.object({
  role: roleSchema, owner: id, startedAt: date, completedAt: date.optional(), model: text.optional(), promptVersion: text,
  status: z.enum(["IN_PROGRESS", "COMPLETED", "ABANDONED"]), inputHashes: hashesSchema, outputHashes: hashesSchema
}).strict();
export const jobStateSchema = z.object({
  schemaVersion: z.literal(1), jobId: id, status: z.enum(statuses), revisionCount: z.number().int().nonnegative(),
  createdAt: date, updatedAt: date, active: runSchema.optional(), runs: z.array(runSchema),
  reviewedHashes: hashesSchema.optional(), gateReason: text.optional(),
  approval: z.object({ by: id, note: text, at: date, simulated: z.boolean(), hashes: hashesSchema }).strict().optional(),
  resets: z.array(z.object({ stage: z.enum(["research", "author", "review"]), reason: text, at: date }).strict())
}).strict();
export type LessonGenerationRequest = z.infer<typeof lessonGenerationRequestSchema>;
export type JobState = z.infer<typeof jobStateSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type SourcePack = z.infer<typeof sourcePackSchema>;
export type MediaPack = z.infer<typeof mediaPackSchema>;
export type LessonArchitecture = z.infer<typeof lessonArchitectureSchema>;
export type QAReport = z.infer<typeof qaReportSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type QuestionSet = z.infer<typeof questionSetSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type ImageCandidate = z.infer<typeof imageCandidateSchema>;
export type VideoCandidate = z.infer<typeof videoCandidateSchema>;
export type BookRecommendation = z.infer<typeof bookRecommendationSchema>;
export type UnsupportedComponentRequest = z.infer<typeof unsupportedComponentRequestSchema>;
export type QAFinding = z.infer<typeof qaFindingSchema>;
