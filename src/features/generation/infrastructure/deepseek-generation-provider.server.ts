import "server-only";

import type {
  GenerationProvider,
  GenerationProviderError,
  GenerationProviderRequest,
  GenerationProviderResult,
  GenerationProviderUsage
} from "@/features/generation/contracts";
import { getDeepSeekProviderConfig, type DeepSeekProviderConfig } from "@/features/generation/infrastructure/deepseek-config.server";
import { withDeepSeekUsageEstimate } from "@/features/generation/pricing";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type DeepSeekChatCompletion = Readonly<{
  choices?: readonly Readonly<{ message?: Readonly<{ content?: string | null }> }>[];
  usage?: Readonly<{
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_cache_hit_tokens?: number;
  }>;
  error?: Readonly<{ message?: string; type?: string; code?: string }>;
}>;

export class DeepSeekGenerationProvider implements GenerationProvider {
  readonly id = "deepseek" as const;

  constructor(
    private readonly config: DeepSeekProviderConfig = getDeepSeekProviderConfig(),
    private readonly fetchImpl: FetchLike = fetch,
    private readonly timeoutMs = 45_000
  ) {}

  // Shared server gateway for bounded contextual assistance; UI never calls a provider.
  async assist(prompt:string):Promise<GenerationProviderResult>{
    if(!this.config.apiKey)return {ok:false,error:{code:"authentication",message:"Tutor is not configured",retryable:false}};
    return this.callDeepSeek({compiledPrompt:{prompt},model:this.config.defaultModel},768);
  }

  async generate(request: GenerationProviderRequest): Promise<GenerationProviderResult> {
    if (!this.config.apiKey) {
      return {
        ok: false,
        error: {
          code: "authentication",
          message: "DeepSeek API key is not configured.",
          retryable: false
        }
      };
    }

    let lastError: GenerationProviderError | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await this.callDeepSeek(request);

      if (result.ok) {
        return result;
      }

      lastError = result.error;

      if (!shouldRetry(result.error)) {
        return result;
      }
    }

    return {
      ok: false,
      error: {
        ...(lastError ?? {
          code: "failed",
          message: "DeepSeek generation failed.",
          retryable: false
        }),
        retryable: false
      }
    };
  }

  private async callDeepSeek(request: Pick<GenerationProviderRequest,"model"> & {compiledPrompt:{prompt:string}},maxTokens?:number): Promise<GenerationProviderResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(new URL("/chat/completions", this.config.baseUrl), {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.apiKey}`,
          "content-type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: request.model,
          response_format: { type: "json_object" },
          temperature: 0.2,
          ...(maxTokens?{max_tokens:maxTokens}:{}),
          messages: [
            {
              role: "system",
              content:
                "You generate only valid JSON. Thinking Mode is off. Do not include Markdown, analysis, comments, or prose outside JSON."
            },
            {
              role: "user",
              content: request.compiledPrompt.prompt
            }
          ]
        })
      });

      const payload = (await response.json().catch(() => null)) as DeepSeekChatCompletion | null;

      if (!response.ok) {
        return { ok: false, error: mapDeepSeekHttpError(response.status, payload) };
      }

      const rawJson = payload?.choices?.[0]?.message?.content?.trim();

      if (!rawJson) {
        return {
          ok: false,
          error: {
            code: "empty_response",
            message: "DeepSeek returned an empty generation response.",
            retryable: true
          }
        };
      }

      return {
        ok: true,
        rawJson,
        usage: mapUsage(request.model, payload?.usage)
      };
    } catch (error) {
      if (isAbortError(error)) {
        return {
          ok: false,
          error: {
            code: "timeout",
            message: "DeepSeek generation timed out.",
            retryable: true
          }
        };
      }

      return {
        ok: false,
        error: {
          code: "transient",
          message: "DeepSeek generation failed before a response was received.",
          retryable: true
        }
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function mapUsage(
  model: string,
  usage: DeepSeekChatCompletion["usage"] | undefined
): GenerationProviderUsage | undefined {
  if (!usage) {
    return undefined;
  }

  return withDeepSeekUsageEstimate({
    model,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    cacheHitTokens: usage.prompt_cache_hit_tokens,
    measuredAt: new Date().toISOString()
  });
}

function mapDeepSeekHttpError(status: number, payload: DeepSeekChatCompletion | null): GenerationProviderError {
  const message = payload?.error?.message ?? "DeepSeek request failed.";

  if (status === 401 || status === 403) {
    return { code: "authentication", message, retryable: false };
  }

  if (status === 402 || /balance|insufficient/i.test(message)) {
    return { code: "insufficient_balance", message, retryable: false };
  }

  if (status === 429) {
    return { code: "rate_limited", message, retryable: false };
  }

  if (status >= 500) {
    return { code: "transient", message, retryable: true };
  }

  return { code: "failed", message, retryable: false };
}

function shouldRetry(error: GenerationProviderError) {
  return error.retryable && (error.code === "empty_response" || error.code === "transient" || error.code === "timeout");
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
