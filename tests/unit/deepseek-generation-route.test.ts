import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GenerationSpec } from "@/features/generation/contracts";

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  repository: {
    create: vi.fn(),
    updateStatus: vi.fn(),
    recordProviderUsage: vi.fn()
  }
}));

vi.mock("@/features/generation/infrastructure/deepseek-config.server", () => ({
  getDeepSeekProviderConfig: () => ({
    provider: "deepseek",
    status: "configured",
    apiKey: "configured-key",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-v4-flash",
    proModel: "deepseek-v4-pro",
    availableModels: ["deepseek-v4-flash", "deepseek-v4-pro"]
  })
}));

vi.mock("@/features/generation/infrastructure/deepseek-generation-provider.server", () => ({
  DeepSeekGenerationProvider: vi.fn(function DeepSeekGenerationProviderMock(this: { generate: typeof mocks.generate }) {
    this.generate = mocks.generate;
  })
}));

vi.mock("@/features/generation/server-repositories", () => ({
  getGenerationJobRepository: () => mocks.repository
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ KNOW_OS_OWNER_ID: "local-owner" })
}));

const spec: GenerationSpec = {
  targetSchema: "caderno.lesson.v1",
  language: "pt-BR",
  audienceLevel: "beginner",
  lessonTitle: "Funções em JavaScript",
  lessonGoal: "Ensinar funções.",
  concepts: [{ id: "js-function", title: "Função" }],
  activityTypes: ["prediction", "code"],
  constraints: ["Retorne JSON."],
  importTarget: {
    packId: "generated.javascript.deepseek",
    version: 1,
    trackId: "generated-javascript",
    trackTitle: "JavaScript gerado",
    moduleId: "generated-basics",
    moduleTitle: "Fundamentos gerados"
  }
};

const validGeneratedLesson = JSON.stringify({
  schema: "caderno.lesson.v1",
  language: "pt-BR",
  lesson: {
    id: "generated-function-lesson",
    version: 1,
    title: "Funções em JavaScript",
    concepts: [{ id: "js-function", title: "Função" }],
    blocks: [{ id: "generated-function-intro", type: "text", text: "Funções agrupam lógica reutilizável." }],
    activities: [
      {
        id: "generated-function-predict",
        type: "prediction",
        conceptIds: ["js-function"],
        prompt: "O que acontece quando chamamos uma função?"
      },
      {
        id: "generated-function-code",
        type: "code",
        conceptIds: ["js-function"],
        prompt: "Crie uma função soma.",
        starterCode: "function soma(a, b) {\n  return 0;\n}",
        tests: []
      }
    ]
  }
});

describe("/api/generation/deepseek/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.repository.create.mockResolvedValue({ id: "job-1" });
    mocks.repository.updateStatus.mockResolvedValue({ id: "job-1" });
    mocks.repository.recordProviderUsage.mockResolvedValue({ id: "job-1" });
  });

  it("rejects v2 before spending a provider call in the legacy v1 workflow", async () => {
    const { POST } = await import("@/app/api/generation/deepseek/generate/route");
    const response = await POST(buildRequest({ ...spec, targetSchema: "caderno.track.v2" }));
    expect(response.status).toBe(400);
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.repository.create).not.toHaveBeenCalled();
  });

  it("validates successful DeepSeek JSON before returning preview", async () => {
    mocks.generate.mockResolvedValue({
      ok: true,
      rawJson: validGeneratedLesson,
      usage: {
        model: "deepseek-v4-flash",
        inputTokens: 10,
        outputTokens: 20,
        measuredAt: "2026-07-31T12:00:00.000Z"
      }
    });
    const { POST } = await import("@/app/api/generation/deepseek/generate/route");

    const response = await POST(buildRequest(spec));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      jobId: "job-1",
      status: "ready_to_import",
      preview: {
        status: "ready_to_preview",
        schema: "caderno.lesson.v1"
      }
    });
    expect(mocks.repository.recordProviderUsage).toHaveBeenCalledWith(
      "local-owner",
      "job-1",
      expect.objectContaining({ model: "deepseek-v4-flash" })
    );
    expect(mocks.repository.updateStatus).toHaveBeenCalledWith("local-owner", "job-1", "validating");
    expect(mocks.repository.updateStatus).toHaveBeenCalledWith("local-owner", "job-1", "ready_to_import");
  });

  it("blocks invalid DeepSeek JSON before preview or import", async () => {
    mocks.generate.mockResolvedValue({
      ok: true,
      rawJson: '{"schema":"caderno.lesson.v1"}'
    });
    const { POST } = await import("@/app/api/generation/deepseek/generate/route");

    const response = await POST(buildRequest(spec));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toMatchObject({
      code: "invalid_generated_lesson",
      status: "invalid"
    });
    expect(mocks.repository.updateStatus).toHaveBeenCalledWith("local-owner", "job-1", "validating");
    expect(mocks.repository.updateStatus).toHaveBeenCalledWith("local-owner", "job-1", "invalid", {
      note: "validation_failed"
    });
  });
});

function buildRequest(body: unknown) {
  return new Request("http://localhost/api/generation/deepseek/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spec: body })
  });
}
