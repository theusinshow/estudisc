import { expect, it, vi } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { questionSchema } from "@/features/questions/contracts";
import { aiRequestSchema } from "@/features/ai/contracts";
import { resolveAiContext, type AiContextSources } from "@/features/ai/context";

function setup() {
  const question = questionSchema.parse(source.questions[0]);
  const sources: AiContextSources = {
    catalog: { getLesson: vi.fn(), getConcept: vi.fn() },
    questions: { aiContext: vi.fn().mockResolvedValue({ question, hints: ["Pense nas partes."], sourceKey: "a".repeat(64) }), view: vi.fn(), interact: vi.fn() },
    sessions: { result: vi.fn() }, mistakes: { listMistakes: vi.fn().mockResolvedValue([]) }, relations: { get: vi.fn().mockResolvedValue(null) }
  };
  return { sources, question };
}
it("builds bounded authored Question facts without assets, answers, owner or full history, and attests through the canonical path", async () => {
  const { sources, question } = setup();
  const input = aiRequestSchema.parse({ requestId: crypto.randomUUID(), action: "give_hint", target: { kind: "question", activityId: "owned-activity", questionId: question.id, questionVersion: question.version } });
  const context = await resolveAiContext("owner", input, sources);
  expect(sources.questions.aiContext).toHaveBeenCalledWith("owner", "owned-activity", question.id, question.version, undefined);
  expect(context.facts).not.toHaveProperty("answer"); expect(context.facts).not.toHaveProperty("assets"); expect(context.facts).not.toHaveProperty("ownerId");
  expect(sources.questions.interact).not.toHaveBeenCalled();
  await context.attestAssistance!();
  expect(sources.questions.interact).toHaveBeenCalledWith("owner", "owned-activity", expect.objectContaining({ action: "solution", questionId: question.id, questionVersion: question.version }));
});
it("requires exact published lesson/version/block sources and strips links from a labelled excerpt", async () => {
  const { sources } = setup();
  vi.mocked(sources.catalog.getLesson).mockResolvedValue({ stableId: "lesson", title: "Aula", trackStableId: "track", trackTitle: "Trilha", concepts: [], activities: [], blocks: [{ stableId: "block", type: "text", payload: { content: "Fonte https://private.example/asset.png texto." } }] });
  const input = aiRequestSchema.parse({ requestId: crypto.randomUUID(), action: "explain_differently", target: { kind: "lesson", trackId: "track", lessonId: "lesson", version: 3, blockId: "block" } });
  const context = await resolveAiContext("owner", input, sources);
  expect(sources.catalog.getLesson).toHaveBeenCalledWith("lesson", 3, "track", true);
  expect(JSON.stringify(context.facts)).not.toContain("https:"); expect(context.facts).toMatchObject({ excerptOnly: true });
  vi.mocked(sources.catalog.getLesson).mockResolvedValue(null);
  await expect(resolveAiContext("owner", input, sources)).rejects.toMatchObject({ code: "context_unavailable" });
});
it("does not invent missing mistakes, completed sessions or curriculum relations", async () => {
  const { sources } = setup();
  vi.mocked(sources.sessions.result).mockResolvedValue(null);
  for (const body of [
    { action: "analyze_mistakes", target: { kind: "mistakes", conceptId: "foreign" } },
    { action: "summarize_session", target: { kind: "session", sessionId: crypto.randomUUID() } },
    { action: "explain_concept_relation", target: { kind: "relation", conceptId: "a", relatedConceptId: "b" } }
  ]) await expect(resolveAiContext("owner", aiRequestSchema.parse({ requestId: crypto.randomUUID(), ...body }), sources)).rejects.toMatchObject({ code: "context_unavailable" });
});
