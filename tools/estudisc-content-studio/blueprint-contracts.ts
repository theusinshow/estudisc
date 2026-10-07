import { z } from "zod";
import { assetReferenceSchema } from "./assets";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const strings = z.array(z.string());
export const lessonBlueprintSchema = z.object({
  schemaVersion: z.literal(1), blueprintVersion: z.literal(1), policyVersion: z.literal("blueprint.v1"),
  identity: z.object({ trackId: z.string(), trackVersion: z.number().int().positive(), lessonId: z.string(), lessonVersion: z.number().int().positive() }).strict(),
  sourceHash: hash, corpusHash: hash, dependencyHash: hash, policyHash: hash, assetHash: hash, inputHash: hash,
  generatedAt: z.iso.datetime(), reviewState: z.literal("UNREVIEWED"),
  summary: z.object({ title: z.string(), subjectCode: z.string(), concepts: z.array(z.object({ id: z.string(), title: z.string() }).strict()), objectives: strings,
    existingBlocks: strings, existingActivities: strings, blockCount: z.number().int().nonnegative(), activityCount: z.number().int().nonnegative(), wordCount: z.number().int().nonnegative(), sourceIds: strings,
    sourceStatus: z.string(), publicationBasis: z.literal("historical-audited-import"), caveats: strings }).strict(),
  learningGoal: z.string().nullable(), commonMistakes: z.array(z.string()).max(0),
  archetypes: strings, recommendedBlocks: strings, visualNeeds: strings, componentNeeds: strings,
  interactionLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]), confidence: z.number().min(0).max(1), confidenceReasons: strings,
  needsDeepReview: z.boolean(), reviewReasons: strings, assetCandidates: z.array(assetReferenceSchema)
}).strict();
export type LessonBlueprint = z.infer<typeof lessonBlueprintSchema>;
export type BlueprintHashes = Pick<LessonBlueprint, "corpusHash" | "dependencyHash" | "policyHash" | "assetHash">;
