import { z } from "zod";
import type { Question } from "@/features/questions/contracts";

export const AI_POLICY = "ai-learning.v1" as const;
const stableId = z.string().trim().min(1).max(160);
const questionTarget = z.object({ kind: z.literal("question"), activityId: stableId, questionId: stableId, questionVersion: z.number().int().positive(), sessionId: z.uuid().optional() }).strict();
const lessonTarget = z.object({ kind: z.literal("lesson"), trackId: stableId, lessonId: stableId, version: z.number().int().positive(), blockId: stableId }).strict();
const base = { requestId: z.uuid(), message: z.string().trim().max(1000).default("") };
export const aiRequestSchema = z.discriminatedUnion("action", [
  z.object({ ...base, action: z.literal("explain_differently"), target: z.discriminatedUnion("kind", [questionTarget, lessonTarget]) }).strict(),
  z.object({ ...base, action: z.literal("give_hint"), target: questionTarget }).strict(),
  z.object({ ...base, action: z.literal("analyze_mistakes"), target: z.object({ kind: z.literal("mistakes"), conceptId: stableId.optional() }).strict() }).strict(),
  z.object({ ...base, action: z.literal("summarize_session"), target: z.object({ kind: z.literal("session"), sessionId: z.uuid() }).strict() }).strict(),
  z.object({ ...base, action: z.literal("explain_concept_relation"), target: z.object({ kind: z.literal("relation"), conceptId: stableId, relatedConceptId: stableId }).strict() }).strict()
]);
export type AiRequest = z.infer<typeof aiRequestSchema>;
export const aiOutputSchema = z.object({ text: z.string().trim().min(1).max(2000), analogy: z.string().trim().min(1).max(500).optional(), example: z.string().trim().min(1).max(500).optional() }).strict();
export type AiOutput = z.infer<typeof aiOutputSchema>;
export const aiUsageSchema = z.object({ model: z.string().min(1).max(120), inputTokens: z.number().int().nonnegative().optional(), outputTokens: z.number().int().nonnegative().optional(), cacheHitTokens: z.number().int().nonnegative().optional(), estimatedCostUsd: z.number().finite().nonnegative().optional(), pricingVersion: z.string().max(120).optional(), measuredAt: z.iso.datetime() }).strict();
export const aiLearningResponseSchema = aiOutputSchema.extend({ source: z.literal("ai"), cached: z.boolean(), assisted: z.boolean(), usage: aiUsageSchema.optional() }).strict();
export type AiActionSpec = { [K in AiRequest["action"]]: Omit<Extract<AiRequest, { action: K }>, "requestId" | "message"> }[AiRequest["action"]];
export const aiFailureCodes = ["unconfigured", "unavailable", "timeout", "cancelled", "invalid_output", "context_unavailable", "exam_active", "rate_limited", "daily_limit", "request_pending", "request_conflict"] as const;
export type AiFailureCode = typeof aiFailureCodes[number];
export class AiLearningError extends Error {
  constructor(readonly code: AiFailureCode, readonly assisted = false) { super(code); }
}
export const aiOutcomeSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), output: aiOutputSchema, usage: aiUsageSchema.optional(), cached: z.boolean() }).strict(),
  z.object({ ok: z.literal(false), code: z.enum(aiFailureCodes), usage: aiUsageSchema.optional(), assisted: z.boolean().optional() }).strict()
]);
export type AiOutcome = z.infer<typeof aiOutcomeSchema>;
export type AiContext = Readonly<{
  sourceKey: string;
  facts: Readonly<Record<string, z.infer<ReturnType<typeof z.json>>>>;
  attestAssistance?: () => Promise<void>;
}>;
export type AiQuestionSource = Readonly<{ question: Question; hints: readonly string[]; sourceKey: string }>;
