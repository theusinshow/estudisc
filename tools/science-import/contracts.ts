import { z } from "zod";

const id = z.string().min(1);
export const editorialBlockSchema = z.object({
  id, type: z.enum(["HOOK", "LEARNING_GOALS", "EXPLANATION", "CALLOUT", "WORKED_EXAMPLE", "MEDIA_RECOMMENDATION", "SUMMARY", "EXIT_TICKET", "IMAGE_REQUEST", "DETERMINISTIC_COMPONENT_REQUEST"]),
  title: id, content: id.optional(), items: z.array(id).optional(), variant: id.optional(), prompt: id.optional(), answer: id.optional(), reasoning: id.optional(),
  mediaRefs: z.array(id).optional(), optional: z.boolean().optional(), answerGuide: z.object({ mustMention: z.array(id) }).optional(), requestRef: id.optional(), request: id.optional(), status: id.optional()
}).strict();
export const editorialPackSchema = z.object({
  lesson: z.object({
    schemaVersion: z.literal("vecta-lesson-content-1"), lessonId: z.string().regex(/^CIE-\d{2}$/), subject: z.literal("CIE"), title: id, unit: id, version: z.literal(2), status: z.literal("APPROVED_CONTENT_PENDING_INTEGRATION"),
    concepts: z.array(z.object({ id, name: id, masteryTarget: id }).strict()).length(6), blocks: z.array(editorialBlockSchema), sourceRefs: z.array(id), mediaRefs: z.array(id), imageRequestRefs: z.array(id), editorialNotes: id
  }).strict(),
  questions: z.array(z.object({ id, type: z.literal("MULTIPLE_CHOICE_SINGLE"), stem: id,
    options: z.array(z.object({ key: id, text: id }).strict()).length(5), correctOption: id, explanation: id,
    difficulty: z.enum(["FOUNDATION", "DIRECT", "APPLIED", "IFSC"]), cognitiveOperation: z.enum(["UNDERSTAND", "ANALYZE", "APPLY", "TRANSFER", "EVALUATE"]),
    conceptIds: z.array(id).min(1), targetedError: id, provenance: z.literal("ORIGINAL_VECTA_GROUNDED_V2")
  }).strict()).length(8)
}).strict();
export const sourceLibrarySchema = z.object({ version: id, sources: z.array(z.object({ id, title: id, type: id, url: z.string().nullable().optional() }).passthrough()) }).passthrough();
export const conceptMapSchema = z.object({ version: z.literal(1), entries: z.array(z.object({ editorialId: id, canonicalId: id, disposition: z.enum(["existing", "intentional_new"]), reason: id, existingTitle: id.optional() }).strict()) }).strict();
export const mediaAssetsSchema = z.object({ assets: z.array(z.object({ requestId: id, path: id, sha256: z.string().regex(/^[a-f0-9]{64}$/), mime: z.enum(["svg+xml", "png", "jpeg", "webp"]), alt: z.string().min(12), caption: id, credit: id, longDescription: id, width: z.number().int().positive(), height: z.number().int().positive(), status: z.literal("LOCAL_DETERMINISTIC_DRAFT") }).strict()) }).strict();
export type EditorialPack = z.infer<typeof editorialPackSchema>;
export type EditorialBlock = z.infer<typeof editorialBlockSchema>;
export type ConceptMap = z.infer<typeof conceptMapSchema>;
export type MediaAssets = z.infer<typeof mediaAssetsSchema>;
export const PILOT = ["CIE-04", "CIE-10", "CIE-18", "CIE-22", "CIE-30", "CIE-33", "CIE-38", "CIE-40"];
export const BATCHES = [["CIE-01", "CIE-02", "CIE-03", "CIE-05", "CIE-06", "CIE-07", "CIE-08"], ["CIE-09", "CIE-11", "CIE-12", "CIE-13", "CIE-14", "CIE-15", "CIE-16"], ["CIE-17", "CIE-19", "CIE-20", "CIE-21", "CIE-23", "CIE-24"], ["CIE-25", "CIE-26", "CIE-27", "CIE-28", "CIE-29", "CIE-31", "CIE-32"], ["CIE-34", "CIE-35", "CIE-36", "CIE-37", "CIE-39"]];
