import { logEvent } from "@/lib/logger";
import { getOwnerId } from "@/features/auth/owner";
import { z } from "zod";
import { NextResponse } from "next/server";

import { getGenerationJobRepository } from "@/features/generation/server-repositories";
import { generationSpecSchema } from "@/features/generation/contracts";
import { validateGeneratedLessonOutput } from "@/features/generation/generated-output-validation";
import { compileManualGenerationSpec } from "@/features/generation/manual-generation-service";
import { DeepSeekGenerationProvider } from "@/features/generation/infrastructure/deepseek-generation-provider.server";
import { getDeepSeekProviderConfig } from "@/features/generation/infrastructure/deepseek-config.server";
import { readJsonRequestWithLimit } from "@/features/import/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  spec: generationSpecSchema.refine((spec) => spec.targetSchema === "caderno.lesson.v1", {
    message: "Use the Admin SourcePack workflow for caderno.track.v2."
  }),
  model: z.enum(["deepseek-v4-flash", "deepseek-v4-pro"]).optional()
});

export async function POST(request: Request) {
  logEvent("info", "generation_requested", { operation: "generation" });
  const providerConfig = getDeepSeekProviderConfig();

  if (!providerConfig.apiKey) {
    return NextResponse.json(
      { code: "deepseek_unconfigured", message: "Configure DEEPSEEK_API_KEY para usar geração direta." },
      { status: 503 }
    );
  }

  const parsedRequest = await readJsonRequestWithLimit(request);

  if (!parsedRequest.ok) {
    return NextResponse.json(
      { code: parsedRequest.code, message: parsedRequest.message },
      { status: parsedRequest.code === "payload_too_large" ? 413 : 400 }
    );
  }

  const requestBody = requestSchema.safeParse(parsedRequest.body);

  if (!requestBody.success) {
    return NextResponse.json(
      {
        code: "invalid_deepseek_generation_request",
        message: "A geração DeepSeek precisa receber uma configuração válida.",
        issues: requestBody.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      },
      { status: 400 }
    );
  }

  const compiled = compileManualGenerationSpec(requestBody.data.spec);

  if (!compiled.ok) {
    return NextResponse.json(
      { code: "invalid_generation_spec", message: "A configuração da geração é inválida.", issues: compiled.issues },
      { status: 400 }
    );
  }

  const model = requestBody.data.model ?? providerConfig.defaultModel;
  const ownerId = await getOwnerId();
  const repository = getGenerationJobRepository();
  const job = await repository.create({
    ownerId,
    mode: "deepseek",
    provider: "deepseek",
    model,
    spec: compiled.spec,
    compiledPrompt: compiled.compiledPrompt,
    status: "generating"
  });
  const provider = new DeepSeekGenerationProvider(providerConfig);
  const generated = await provider.generate({
    jobId: job.id,
    spec: compiled.spec,
    compiledPrompt: compiled.compiledPrompt,
    model
  });

  if (!generated.ok) {
    const status = mapProviderErrorToGenerationStatus(generated.error.code);
    await repository.updateStatus(ownerId, job.id, status, { note: generated.error.code });
    return NextResponse.json(
      {
        code: generated.error.code,
        message: generated.error.message,
        retryable: generated.error.retryable,
        jobId: job.id,
        status
      },
      { status: mapProviderErrorToHttpStatus(generated.error.code) }
    );
  }

  if (generated.usage) {
    await repository.recordProviderUsage(ownerId, job.id, generated.usage);
  }

  await repository.updateStatus(ownerId, job.id, "validating");
  const validation = validateGeneratedLessonOutput(generated.rawJson);

  if (validation.status === "invalid") {
    await repository.updateStatus(ownerId, job.id, "invalid", { note: "validation_failed" });
    return NextResponse.json(
      {
        code: "invalid_generated_lesson",
        message: "A resposta da DeepSeek não passou na validação.",
        jobId: job.id,
        status: "invalid",
        issues: validation.issues
      },
      { status: 400 }
    );
  }

  await repository.updateStatus(ownerId, job.id, "ready_to_import");
  return NextResponse.json({
    jobId: job.id,
    status: "ready_to_import",
    rawJson: generated.rawJson,
    preview: validation,
    usage: generated.usage ?? null,
    importTarget: compiled.spec.importTarget
  });
}

function mapProviderErrorToGenerationStatus(code: string) {
  if (code === "rate_limited") {
    return "rate_limited";
  }

  if (code === "insufficient_balance") {
    return "insufficient_balance";
  }

  if (code === "timeout") {
    return "timeout";
  }

  if (code === "authentication" || code === "invalid_request") {
    return "failed";
  }

  return "failed";
}

function mapProviderErrorToHttpStatus(code: string) {
  if (code === "authentication") {
    return 401;
  }

  if (code === "insufficient_balance") {
    return 402;
  }

  if (code === "rate_limited") {
    return 429;
  }

  if (code === "timeout") {
    return 504;
  }

  return 502;
}

