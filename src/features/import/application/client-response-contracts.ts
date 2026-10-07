import { z } from "zod";
const summary = z.object({ trackStableId: z.string(), trackTitle: z.string(), moduleCount: z.number(), lessonCount: z.number(), activityCount: z.number(), conceptCount: z.number() });
const identity = { packId: z.string(), version: z.number().int().positive() };
export const previewResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ready"), operation: z.literal("import"), ...identity, contentHash: z.string(), summary }),
  z.object({ status: z.literal("already_imported"), operation: z.literal("no_change"), ...identity, contentHash: z.string(), summary }),
  z.object({ status: z.literal("conflict"), operation: z.literal("blocked_conflict"), ...identity, message: z.string(), existingContentHash: z.string(), incomingContentHash: z.string(), summary })
]);
export const importResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("imported"), ...identity, lessonId: z.string().optional(), lessonVersion: z.number().int().positive().optional(), summary: z.object({ trackStableId: z.string(), importedLessons: z.number(), importedActivities: z.number() }) }),
  z.object({ status: z.literal("already_imported"), ...identity })
]);
export const generatedPreviewResponseSchema = z.object({ status: z.literal("ready_to_preview"), operation: z.literal("validate_only"), schema: z.literal("caderno.lesson.v1"), contentHash: z.string(), summary: z.object({ lessonStableId: z.string(), lessonTitle: z.string(), conceptCount: z.number(), blockCount: z.number(), activityCount: z.number() }) });
const compiledPrompt = z.object({ targetSchema: z.literal("caderno.lesson.v1"), prompt: z.string(), jsonExample: z.string() });
export const compiledResponseSchema = z.object({ jobId: z.string(), compiledPrompt });
export const generatedResponseSchema = z.object({ jobId: z.string(), rawJson: z.string(), preview: generatedPreviewResponseSchema, usage: z.object({ model: z.string(), measuredAt: z.string(), inputTokens: z.number().optional(), outputTokens: z.number().optional(), cacheHitTokens: z.number().optional(), estimatedCostUsd: z.number().optional(), pricingVersion: z.string().optional() }).nullable() });
