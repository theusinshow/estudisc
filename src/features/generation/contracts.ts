import { z } from "zod";

export const generationStatuses = [
  "draft",
  "compiled",
  "waiting_external_response",
  "ready",
  "generating",
  "receiving",
  "validating",
  "repairing",
  "ready_to_import",
  "invalid",
  "rate_limited",
  "insufficient_balance",
  "timeout",
  "failed",
  "imported"
] as const;

export type GenerationStatus = (typeof generationStatuses)[number];

export type GenerationMode = "manual_copy_paste" | "deepseek";

export type GenerationSchemaTarget = "caderno.lesson.v1" | "caderno.track.v2";

export const generationImportTargetSchema = z.object({
  packId: z.string().regex(/^[a-z0-9][a-z0-9._-]{2,127}$/),
  version: z.number().int().min(1),
  trackId: z.string().trim().min(1),
  trackTitle: z.string().trim().min(1),
  moduleId: z.string().trim().min(1),
  moduleTitle: z.string().trim().min(1)
});

export const generationSpecSchema = z.object({
  targetSchema: z.enum(["caderno.lesson.v1","caderno.track.v2"]),
  sourcePackContext:z.object({subjectCode:z.enum(["MAT","POR","CIE","GH"]),sourceIds:z.array(z.string().min(1)).min(1),requirementIds:z.array(z.string().min(1)).min(1),prerequisiteConceptIds:z.array(z.string().min(1)).default([])}).strict().optional(),
  language: z.literal("pt-BR"),
  audienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  lessonTitle: z.string().trim().min(1),
  lessonGoal: z.string().trim().min(1),
  concepts: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        title: z.string().trim().min(1),
        summary: z.string().trim().optional()
      })
    )
    .min(1),
  activityTypes: z.array(z.enum(["prediction", "multiple-choice", "explain", "code", "debug"])).min(1),
  constraints: z.array(z.string().trim().min(1)).default([]),
  importTarget: generationImportTargetSchema
});

export type GenerationImportTarget = z.infer<typeof generationImportTargetSchema>;
export type GenerationSpec = z.infer<typeof generationSpecSchema>;

export type CompiledGenerationPrompt = Readonly<{
  targetSchema: GenerationSchemaTarget;
  prompt: string;
  jsonExample: string;
}>;

export type GenerationProviderUsage = Readonly<{
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheHitTokens?: number;
  estimatedCostUsd?: number;
  pricingVersion?: string;
  measuredAt: string;
}>;

export type GenerationProviderErrorCode =
  | "invalid_request"
  | "authentication"
  | "rate_limited"
  | "insufficient_balance"
  | "timeout"
  | "empty_response"
  | "transient"
  | "failed";

export type GenerationProviderError = Readonly<{
  code: GenerationProviderErrorCode;
  message: string;
  retryable: boolean;
  technicalDetails?: string;
}>;

export type GenerationProviderRequest = Readonly<{
  jobId: string;
  spec: GenerationSpec;
  compiledPrompt: CompiledGenerationPrompt;
  model: string;
}>;

export type GenerationProviderResult =
  | Readonly<{ ok: true; rawJson: string; usage?: GenerationProviderUsage }>
  | Readonly<{ ok: false; error: GenerationProviderError }>;

export type GenerationProvider = Readonly<{
  id: GenerationMode;
  generate(request: GenerationProviderRequest): Promise<GenerationProviderResult>;
}>;
