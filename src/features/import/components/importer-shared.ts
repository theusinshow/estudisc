import { apiErrorSchema } from "@/lib/api-response";
export type PreviewSummary = Readonly<{
  trackStableId: string;
  trackTitle: string;
  moduleCount: number;
  lessonCount: number;
  activityCount: number;
  conceptCount: number;
}>;

export type PreviewResult =
  | Readonly<{
      status: "ready";
      operation: "import";
      packId: string;
      version: number;
      contentHash: string;
      summary: PreviewSummary;
    }>
  | Readonly<{
      status: "already_imported";
      operation: "no_change";
      packId: string;
      version: number;
      contentHash: string;
      summary: PreviewSummary;
    }>
  | Readonly<{
      status: "conflict";
      operation: "blocked_conflict";
      packId: string;
      version: number;
      message: string;
      existingContentHash: string;
      incomingContentHash: string;
      summary: PreviewSummary;
    }>;

export type ImportResult =
  | Readonly<{
      status: "imported";
      lessonId?: string;
      lessonVersion?: number;
      packId: string;
      version: number;
      summary: {
        trackStableId: string;
        importedLessons: number;
        importedActivities: number;
      };
    }>
  | Readonly<{ status: "already_imported"; packId: string; version: number }>;

export type ApiError = Readonly<{
  code?: string;
  message?: string;
  retryable?: boolean;
  jobId?: string;
  status?: string;
  issues?: readonly { path: string; message: string }[];
}>;

export type DeepSeekReadiness = Readonly<{
  status: "configured" | "unconfigured";
  defaultModel: "deepseek-v4-flash" | "deepseek-v4-pro";
  proModel: "deepseek-v4-flash" | "deepseek-v4-pro";
}>;

export type GenerationUsage = Readonly<{
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheHitTokens?: number;
  estimatedCostUsd?: number;
  pricingVersion?: string;
  measuredAt: string;
}>;

export type CompiledPrompt = Readonly<{
  targetSchema: "caderno.lesson.v1";
  prompt: string;
  jsonExample: string;
}>;

export type ManualRecoveryDraft = Readonly<{
  id: number;
  jobId: string;
  compiledPrompt: CompiledPrompt;
  lessonTitle: string;
  lessonGoal: string;
  conceptLines: string;
  message: string;
}>;

export type ImportIntent = "study" | "create";

export type GeneratedLessonPreview = Readonly<{
  status: "ready_to_preview";
  operation: "validate_only";
  schema: "caderno.lesson.v1";
  contentHash: string;
  summary: {
    lessonStableId: string;
    lessonTitle: string;
    conceptCount: number;
    blockCount: number;
    activityCount: number;
  };
}>;

export function parseJsonSource(source: string) {
  if (!source.trim()) {
    return { ok: false as const, message: "Cole um JSON de Track Pack ou carregue o exemplo." };
  }

  try {
    return { ok: true as const, value: JSON.parse(source) as unknown };
  } catch {
    return { ok: false as const, message: "O conteúdo informado não é um JSON válido." };
  }
}

export function formatEstimatedUsd(value: number | undefined) {
  if (value === undefined) {
    return "Indisponível";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 6,
    maximumFractionDigits: 9
  }).format(value);
}

export async function readApiErrorPayload(response: Response): Promise<ApiError | null> {
  const parsed = apiErrorSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data : null;
}

export function formatApiError(payload: ApiError | null, fallback: string) {
  if (!payload) {
    return fallback;
  }

  if (payload.issues?.length) {
    return payload.issues.map((issue) => `${issue.path}: ${issue.message}`).join(" ");
  }

  return payload.message ?? payload.code ?? fallback;
}

export async function readApiError(response: Response): Promise<string> {
  return formatApiError(await readApiErrorPayload(response), "A resposta da importação não pôde ser lida.");
}

export function parseConceptLines(source: string) {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id = "", title = "", summary] = line.split("|").map((part) => part.trim());

      return {
        id,
        title: title || id,
        ...(summary ? { summary } : {})
      };
    });
}

export type DeepSeekFailure = Readonly<{
  message: string;
  technicalDetails: Readonly<{
    httpStatus: number | "network_error";
    code?: string;
    retryable?: boolean;
    jobId?: string;
    generationStatus?: string;
    message: string;
  }>;
}>;
