import { z } from "zod";
const id = z.string().trim().min(1).max(160);
const ids = z.array(id).max(100).refine(values => new Set(values).size === values.length, "Duplicate metadata reference");
export const licenseStatusSchema = z.enum(["APPROVED_EMBED", "LINK_ONLY", "REQUIRES_REVIEW", "UNKNOWN", "REJECTED"]);
export type AssetLicenseStatus = z.infer<typeof licenseStatusSchema>;
export const teachingAssetMetadataSchema = z.object({
  version: z.number().int().positive(), type: z.enum(["photo", "illustration", "diagram", "sequence", "map", "chart"]),
  subjectCodes: ids.min(1), conceptIds: ids.min(1), tags: ids,
  width: z.number().int().positive().max(4000), height: z.number().int().positive().max(4000), longDescription: z.string().trim().min(1).max(10000),
  reusable: z.boolean(), interactiveReady: z.boolean(), rightsEvidence: z.string().trim().min(1).max(2000),
  exposure: z.enum(["teaching", "protected"]), protectedQuestionAssetId: z.uuid().optional(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/).optional()
}).strict();
export type TeachingAssetMetadata = z.infer<typeof teachingAssetMetadataSchema>;
