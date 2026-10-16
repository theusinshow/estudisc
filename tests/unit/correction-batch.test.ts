// @vitest-environment node
import { expect, it } from "vitest";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { resolveLessonVersionContext } from "@/features/import/application/lesson-version-policy";
import { buildCorrection } from "../../tools/estudisc-content-studio/correction-batch";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";

const meta = { packId: "estudisc.correction.batch-fixture", authorId: "fixture-author", reason: "Phase 1 cleanup of internal editorial text" };

function setup() {
  const { context, base } = lessonVersionFixture();
  const before = structuredClone(base), after = structuredClone(base);
  const texts = after.blocks.filter(block => typeof block.payload.content === "string" && ["note", "text", "summary", "worked-example"].includes(block.type));
  texts[0].payload = { ...texts[0].payload, content: "Texto limpo." };
  after.blocks = after.blocks.filter(block => block.id !== texts[1].id);
  return { context, base, before, after, edited: texts[0].id, removed: texts[1].id };
}

it("carries replaced and removed blocks onto the published base and passes the import policy", () => {
  const { context, base, before, after, removed } = setup();
  const published = structuredClone(base);
  published.blocks.push({ ...structuredClone(published.blocks[0]), id: "ENRICHMENT-KEEP" });
  const contextWithEnrichment = structuredClone(context);
  contextWithEnrichment.track.modules[0].lessons = contextWithEnrichment.track.modules[0].lessons.map(lesson => lesson.id === base.id ? published : lesson);
  const outcome = buildCorrection({ context: contextWithEnrichment, moduleId: "mat", base: published, before, after, ...meta });
  expect(outcome.status).toBe("ready");
  if (outcome.status !== "ready") return;
  expect([outcome.replaced, outcome.removed]).toEqual([1, 1]);
  expect(outcome.pack.lesson.blocks.map(block => block.id)).toContain("ENRICHMENT-KEEP");
  expect(outcome.pack.lesson.blocks.map(block => block.id)).not.toContain(removed);
  expect(resolveLessonVersionContext([contextWithEnrichment], outcome.pack).base.version).toBe(base.version);
});

it("skips a lesson whose published block no longer matches the pre-cleanup source", () => {
  const { context, base, before, after, edited } = setup();
  const published = structuredClone(base);
  const block = published.blocks.find(entry => entry.id === edited)!;
  block.payload = { ...block.payload, content: "Mudado em produção." };
  const outcome = buildCorrection({ context, moduleId: "mat", base: published, before, after, ...meta });
  expect(outcome).toMatchObject({ status: "skipped" });
});

it("reports unchanged lessons and refuses cleanups that add blocks", () => {
  const { context, base } = lessonVersionFixture();
  expect(buildCorrection({ context, moduleId: "mat", base, before: base, after: structuredClone(base), ...meta }).status).toBe("unchanged");
  const published = structuredClone(base); published.blocks.push({ ...structuredClone(base.blocks[0]), id: "ENRICHMENT-ONLY" });
  const grown = structuredClone(base); grown.blocks.push({ ...structuredClone(base.blocks[0]), id: "ENRICHMENT-ONLY" });
  expect(buildCorrection({ context, moduleId: "mat", base: published, before: base, after: grown, ...meta })).toMatchObject({ status: "skipped" });
  expect(hashCanonicalJson(base)).toBe(hashCanonicalJson(lessonVersionFixture().base));
});

it("turns reviewed Question changes into lesson-bound next versions and rebinds Activities", () => {
  const { context, base } = lessonVersionFixture();
  const activity = base.activities.find(entry => entry.type === "question")!;
  const original = context.questions.find(question => question.id === activity.questionId)!;
  const reviewed = { ...structuredClone(original), version: 99, status: "published" as const, choices: [...(original.choices ?? [])].reverse() };
  const outcome = buildCorrection({ context, moduleId: "mat", base, before: base, after: structuredClone(base), ...meta, reviewedQuestions: [reviewed, structuredClone(original)] });
  expect(outcome.status).toBe("ready");
  if (outcome.status !== "ready") return;
  expect(outcome.questions).toBe(1);
  expect(outcome.pack.questionVersions?.[0]).toMatchObject({ id: original.id, version: original.version + 1, status: "draft" });
  expect(outcome.pack.corrections).toBeUndefined();
  expect(outcome.pack.lesson.activities.find(entry => entry.id === activity.id)?.config).toMatchObject({ questionVersion: original.version + 1 });
  expect(resolveLessonVersionContext([context], outcome.pack).projection.questions.find(question => question.id === original.id)?.version).toBe(original.version + 1);
});

it("places a new source block after its preceding source block and passes the import policy", () => {
  const { context, base } = lessonVersionFixture();
  const after = structuredClone(base);
  const anchor = after.blocks.find(block => typeof block.payload.content === "string" && ["note", "text", "summary", "worked-example"].includes(block.type))!;
  const conceptId = base.concepts[0].id;
  const added = { ...structuredClone(anchor), id: "CASES-THAT-FALL", conceptIds: [conceptId], payload: { ...anchor.payload, title: "Casos que caem", content: "✅ Fui à feira. ❌ Fui a feira." } };
  after.blocks.splice(after.blocks.indexOf(anchor) + 1, 0, added);
  const outcome = buildCorrection({ context, moduleId: "mat", base, before: base, after, ...meta });
  expect(outcome.status).toBe("ready");
  if (outcome.status !== "ready") return;
  expect(outcome.added).toBe(1);
  const ids = outcome.pack.lesson.blocks.map(block => block.id);
  expect(ids.indexOf("CASES-THAT-FALL")).toBe(ids.indexOf(anchor.id) + 1);
  expect(resolveLessonVersionContext([context], outcome.pack).base.id).toBe(base.id);
});
