import { z } from "zod";
import { licenseStatusSchema, sourcePackSchema, mediaPackSchema } from "../tools/estudisc-content-studio/contracts";

export { sourcePackSchema, mediaPackSchema };
export const subjects = ["MAT", "POR", "CIE", "GH", "IFSC", "CROSS-SUBJECT"] as const;
const text = z.string().trim().min(1);
const url = z.url().refine(value => /^https?:\/\//.test(value), "HTTP(S) required");
const strings = z.array(text).refine(values => new Set(values).size === values.length, "Duplicate value");
export const libraryMetadataSchema = z.object({
  schemaVersion: z.literal(1),
  canonicalUrl: url, originalUrls: z.array(url).min(1),
  resourceType: z.enum(["OFFICIAL_DOCUMENT", "OFFICIAL_DATASET", "TEXTBOOK", "BOOK", "ARTICLE", "EDUCATIONAL_SITE", "SCIENTIFIC_SOURCE", "VIDEO", "IMAGE", "MAP", "INFOGRAPHIC", "SIMULATION", "INTERACTIVE_TOOL", "PDF", "QUESTION_BANK", "OFFICIAL_EXAM", "ANSWER_KEY", "REFERENCE_PAGE", "COURSE_MATERIAL", "OTHER"]),
  subjects: z.array(z.enum(subjects)).min(1).refine(values => new Set(values).size === values.length, "Duplicate subject"),
  topics: strings, conceptIds: strings,
  conceptMappingStatus: z.enum(["MAPPED", "NEEDS_REVIEW", "NOT_APPLICABLE"]),
  quality: z.enum(["A", "B", "C", "D", "REJECTED"]), qualityReason: text,
  licenseStatus: licenseStatusSchema, license: text, licenseEvidenceUrl: url.optional(),
  attribution: text.optional(), publisher: text, author: text.optional(),
  recommendedUse: text, usageRole: z.enum(["SUPPLEMENTAL", "CENTRAL_REFERENCE"]),
  status: z.enum(["ACTIVE", "INBOX", "BROKEN", "ARCHIVED", "REJECTED"]),
  addedAt: z.iso.datetime(), lastVerifiedAt: z.iso.datetime().optional(),
  reviewReasons: strings, userNotes: z.array(text),
  identifiers: z.record(text, text), replacementUrls: z.array(url),
  history: z.array(z.object({ at: z.iso.datetime(), action: text, reason: text }).strict()),
  details: z.record(text, z.unknown()),
  official: z.object({
    year: z.number().int().positive().optional(), semester: z.number().int().min(1).max(2).optional(),
    documentType: text, officialStatus: z.enum(["VERIFIED", "UNVERIFIED"]),
    publicationDate: z.iso.date().optional(), protected: z.boolean(), reservedForAssessment: z.boolean()
  }).strict().optional()
}).strict().superRefine((value, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  if (value.conceptMappingStatus === "MAPPED" && !value.conceptIds.length) issue("MAPPED needs actual Concept IDs");
  if (value.conceptMappingStatus === "NOT_APPLICABLE" && value.conceptIds.length) issue("NOT_APPLICABLE cannot have Concept IDs");
  if (value.licenseStatus === "APPROVED_EMBED" && (!value.licenseEvidenceUrl || !value.lastVerifiedAt || !value.attribution)) issue("Embedding needs license evidence, attribution and verification");
  if (["INBOX", "BROKEN", "REJECTED"].includes(value.status) && !value.reviewReasons.length) issue("Unusable/unresolved sources need reasons");
  if (value.conceptMappingStatus === "NEEDS_REVIEW" && !value.reviewReasons.length) issue("Uncertain mapping needs a review reason");
  if (["UNKNOWN", "REQUIRES_REVIEW"].includes(value.licenseStatus) && !value.reviewReasons.length) issue("Unverified rights need a review reason");
  if ((value.quality === "REJECTED" || value.licenseStatus === "REJECTED") && !["REJECTED", "ARCHIVED"].includes(value.status)) issue("Rejected source cannot be active");
  if (value.subjects.includes("IFSC") && !value.official) issue("IFSC needs official document metadata (omit unknown dates)");
  if (value.official?.reservedForAssessment && !value.official.protected) issue("Reserved official material must be protected");
});
export type LibraryMetadata = z.infer<typeof libraryMetadataSchema>;
export type SourcePack = z.infer<typeof sourcePackSchema>;

export const taxonomySchema = z.object({
  schemaVersion: z.literal(1), sourceScopeVerified: z.literal(false),
  existingSourceIds: strings,
  origins: z.array(z.object({ path: text, sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict()),
  lessons: z.array(z.object({ subject: z.enum(subjects), id: text, topic: text, conceptIds: strings }).strict()),
  concepts: z.array(z.object({ id: text, subjects: strings, lessonIds: strings, origins: strings, seedPresent: z.boolean() }).strict())
}).strict();
export type Taxonomy = z.infer<typeof taxonomySchema>;
