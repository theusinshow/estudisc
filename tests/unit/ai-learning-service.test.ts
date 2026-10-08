import { afterEach, describe, expect, it, vi } from "vitest";
import { AIService, type LearningAiProvider } from "@/features/ai/ai-service";
import { AiLearningError, aiRequestSchema, type AiContext } from "@/features/ai/contracts";
import { MemoryAiLearningRepository } from "@/db/repositories/ai-learning-repository";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { AI_TIMEOUT_MS } from "@/features/ai/usage-policy";

const now = new Date("2026-10-08T12:00:00Z");
const context: AiContext = { sourceKey: "a".repeat(64), facts: { excerpt: "Uma fração representa partes de um todo." } };
const request = () => aiRequestSchema.parse({ action: "give_hint", requestId: crypto.randomUUID(), target: { kind: "question", activityId: "a", questionId: "q", questionVersion: 1 } });
function setup() {
  const store = structuredClone(getMemoryStore()); store.events = []; store.assessmentInstances = [];
  const ledger = new MemoryAiLearningRepository(store);
  const assist = vi.fn<LearningAiProvider["assist"]>().mockResolvedValue({ ok: true, rawJson: JSON.stringify({ text: "Observe quantas partes iguais há no todo." }) });
  const provider = { id: "mock", model: "small", configured: true, assist };
  return { store, ledger, assist, provider, service: new AIService(provider, ledger, () => now) };
}
afterEach(() => vi.useRealTimers());

describe("bounded optional contextual AI", () => {
  it("does not reserve, expose a solution or call a missing provider", async () => {
    const ctx = setup(); ctx.provider.configured = false; const attestAssistance = vi.fn();
    await expect(ctx.service.execute("owner", request(), { ...context, attestAssistance })).rejects.toMatchObject({ code: "unconfigured" });
    expect(ctx.assist).not.toHaveBeenCalled(); expect(attestAssistance).not.toHaveBeenCalled(); expect(ctx.store.events).toHaveLength(0);
  });
  it("attests all Question output, isolates owner/version/model caches and preserves immutable replay", async () => {
    const ctx = setup(), input = request(), attestAssistance = vi.fn().mockResolvedValue(undefined);
    const result = await ctx.service.execute("owner", input, { ...context, attestAssistance });
    expect(result).toMatchObject({ source: "ai", assisted: true, cached: false });
    expect(await ctx.service.execute("owner", input, { ...context, attestAssistance })).toMatchObject({ cached: true });
    expect(await ctx.service.execute("owner", request(), { ...context, attestAssistance })).toMatchObject({ cached: true });
    expect(ctx.assist).toHaveBeenCalledTimes(1); expect(attestAssistance).toHaveBeenCalledTimes(3);
    await ctx.service.execute("other-owner", request(), context);
    await ctx.service.execute("owner", request(), { ...context, sourceKey: "b".repeat(64) });
    ctx.provider.model = "another-model"; await ctx.service.execute("owner", request(), context);
    expect(ctx.assist).toHaveBeenCalledTimes(4);
    expect(ctx.assist.mock.calls[0][0]).not.toContain("owner");
    await expect(ctx.service.execute("owner", input, context)).rejects.toMatchObject({ code: "request_conflict" });
  });
  it("rejects authoritative/oversized provider output and retains a consumed reservation", async () => {
    const ctx = setup();
    ctx.assist.mockResolvedValueOnce({ ok: true, rawJson: '{"text":"ok","mastery":5}' });
    const input = request(); await expect(ctx.service.execute("owner", input, context)).rejects.toMatchObject({ code: "invalid_output" });
    await expect(ctx.service.execute("owner", input, context)).rejects.toMatchObject({ code: "invalid_output" });
    expect(ctx.assist).toHaveBeenCalledTimes(1); expect(ctx.store.events).toHaveLength(2);
    await expect(ctx.service.execute("owner", request(), { ...context, facts: { excerpt: "x".repeat(16001) } })).rejects.toMatchObject({ code: "context_unavailable" });
    expect(ctx.assist).toHaveBeenCalledTimes(1);
  });
  it("truthfully preserves assistance attested before a failed provider request and its replay",async()=>{
    const ctx=setup(),input=request(),attestAssistance=vi.fn().mockResolvedValue(undefined);
    ctx.assist.mockResolvedValue({ok:false,error:{code:"transient",message:"Fixture failure",retryable:true}});
    await expect(ctx.service.execute("owner",input,{...context,attestAssistance})).rejects.toMatchObject({code:"unavailable",assisted:true});
    await expect(ctx.service.execute("owner",input,{...context,attestAssistance})).rejects.toMatchObject({code:"unavailable",assisted:true});
    expect(ctx.assist).toHaveBeenCalledTimes(1);expect(attestAssistance).toHaveBeenCalledTimes(1);
  });
  it("cancels a provider that ignores its signal and logs no successful assistance result", async () => {
    const ctx = setup(), controller = new AbortController(); let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    ctx.assist.mockImplementation(() => { entered(); return new Promise(() => {}); });
    const pending = ctx.service.execute("owner", request(), context, controller.signal);
    const assertion = expect(pending).rejects.toMatchObject({ code: "cancelled" });
    await started; controller.abort(); await assertion;
    expect((ctx.store.events.at(-1)?.payload as { outcome: unknown }).outcome).toMatchObject({ ok: false, code: "cancelled" });
  });
  it("bounds timeout even when a provider never settles, and blocks output if an exam begins", async () => {
    vi.useFakeTimers(); const ctx = setup();
    ctx.assist.mockImplementation(() => new Promise(() => {}));
    const pending = ctx.service.execute("owner", request(), context);
    const assertion = expect(pending).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS); await assertion;
    ctx.assist.mockResolvedValue({ ok: true, rawJson: '{"text":"Uma pista."}' });
    vi.spyOn(ctx.ledger, "assertAllowed").mockResolvedValueOnce(undefined).mockRejectedValueOnce(new AiLearningError("exam_active"));
    await expect(ctx.service.execute("owner", request(), { ...context, sourceKey: "c".repeat(64) })).rejects.toMatchObject({ code: "exam_active" });
  });
});
