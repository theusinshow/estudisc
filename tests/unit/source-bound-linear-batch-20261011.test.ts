import { describe, expect, it } from "vitest";
import { loadBlueprintCorpus } from "../../tools/estudisc-content-studio/blueprint-sources";
import { createLessonBlueprint } from "../../tools/estudisc-content-studio/blueprint-policy";
import { createEnrichmentPreview } from "../../tools/estudisc-content-studio/enrichment";
import { numericEnrichmentRecipeSchema } from "../../tools/estudisc-content-studio/enrichment-contracts";
import { linearExplorerSchema } from "@/features/lessons/blocks/numeric-explorer-schema";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { resolveLessonVersionContext } from "@/features/import/application/lesson-version-policy";
import { hashCanonicalJson } from "@/lib/canonical-json";
import portions from "../../tools/estudisc-content-studio/recipes/served-portions-linear.v1.json";
import fractions from "../../tools/estudisc-content-studio/recipes/equivalent-fractions-linear.v1.json";
import system from "../../tools/estudisc-content-studio/recipes/system-substitution-linear.v1.json";
import discriminant from "../../tools/estudisc-content-studio/recipes/quadratic-discriminant-linear.v1.json";

const recipes = [portions, fractions, system, discriminant];
const corpus = loadBlueprintCorpus(process.cwd());
const fixtureHashes = { corpusHash: "a".repeat(64), dependencyHash: "b".repeat(64), policyHash: "c".repeat(64), assetHash: "d".repeat(64) };
const model = (recipe: typeof portions | typeof fractions | typeof system | typeof discriminant) => linearExplorerSchema.parse(recipe.additions[0].parameters);
const result = (recipe: typeof portions | typeof fractions | typeof system | typeof discriminant, value: number) => { const c = model(recipe); return c.slope * value + c.intercept; };

describe("source-bound mathematical exploration batch", () => {
  it.each(recipes)("retains original goals, content, Activities and Questions for $identity.lessonId", raw => {
    const recipe = numericEnrichmentRecipeSchema.parse(raw);
    const { pack } = corpus.find(c => c.pack.track.id === recipe.identity.trackId)!;
    const moduleRecord = pack.track.modules.find(m => m.lessons.some(l => l.id === recipe.identity.lessonId))!;
    const source = moduleRecord.lessons.find(l => l.id === recipe.identity.lessonId)!;
    const before = hashCanonicalJson(pack);
    const blueprint = createLessonBlueprint(pack, moduleRecord.subjectCode, source, fixtureHashes, [], "2026-10-11T00:00:00Z");
    const preview = createEnrichmentPreview(pack, blueprint, recipe);
    const originals = preview.lesson.blocks.filter(b => source.blocks.some(old => old.id === b.id));
    expect({ ...preview.lesson, blocks: originals, version: source.version, status: source.status }).toEqual(source);
    expect(hashCanonicalJson(pack)).toBe(before);
    expect(preview.newBlocks).toHaveLength(1);
    expect(preview.newBlocks[0].type).toBe("numeric-explorer");
    expect(preview.newBlocks[0].payload.contentStudio).toMatchObject({ enrichment: { purpose: "exploration", reviewStatus: "community_feedback_pending" } });
    const ids = [...new Set([...source.exitTicketQuestionIds, ...source.activities.flatMap(a => a.questionId ? [a.questionId] : [])])];
    expect(preview.questionReferences.map(r => r.id)).toEqual(ids);
    for (const ref of preview.questionReferences) expect(ref.hash).toBe(hashCanonicalJson(pack.questions.find(q => q.id === ref.id)));
    const packet = lessonVersionPackSchema.parse({ schema: "caderno.lesson.v2", packId: `fixture.linear.${source.id.toLowerCase()}`, version: 1, authorId: "fixture-author", target: { trackId: pack.track.id, trackVersion: pack.version, moduleId: moduleRecord.id, lessonId: source.id, baseVersion: source.version, baseHash: recipe.sourceLessonHash }, lesson: preview.lesson, questionReferences: preview.questionReferences });
    expect(() => resolveLessonVersionContext([pack], packet)).not.toThrow();
  });

  it("conserves all twelve portions and keeps the whole as the denominator", () => {
    const c = model(portions);
    expect(c).toMatchObject({ min: 0, max: 12, step: 1, initial: 5, integerInput: true });
    for (let served = 0; served <= 12; served++) {
      expect(served + result(portions, served)).toBe(12);
      expect(result(portions, served)).toBeGreaterThanOrEqual(0);
    }
    expect(result(portions, 5)).toBe(7);
    expect(c.explanation).toContain("denominador das duas frações continua 12");
  });

  it("changes both fraction counts together instead of modifying just one term", () => {
    const c = model(fractions);
    expect(c).toMatchObject({ min: 10, max: 60, step: 10, initial: 30, integerInput: true });
    for (let denominator = 10; denominator <= 60; denominator += 10) {
      expect(10 * result(fractions, denominator)).toBe(7 * denominator);
    }
    expect(result(fractions, 30)).toBe(21);
  });

  it("compares the substituted sum with seventeen and checks both original equations", () => {
    expect(result(system, 6)).toBe(17);
    const v = 2 * 6 - 1;
    expect(v).toBe(11);
    expect(6 + v).toBe(17);
    expect(result(system, 5.5)).toBe(15.5);
    expect(result(system, 6.5)).toBe(18.5);
    expect(model(system).explanation).toContain("não são automaticamente soluções");
  });

  it("covers positive, zero and negative discriminants without a quadratic solver", () => {
    expect(model(discriminant).mode).toBe("linear");
    expect(result(discriminant, -10)).toBe(49);
    expect(result(discriminant, 2.25)).toBe(0);
    expect(result(discriminant, 2.5)).toBe(-1);
    for (const root of [5, -2]) expect(root * root - 3 * root - 10).toBe(0);
    expect((2.25 - model(discriminant).min) / model(discriminant).step).toBe(49);
  });

  it("rejects an authored initial result that contradicts source arithmetic", () => {
    const recipe = structuredClone(discriminant);
    recipe.additions[0].expectedInitialResult = -49;
    const { pack } = corpus.find(c => c.pack.track.id === recipe.identity.trackId)!;
    const moduleRecord = pack.track.modules.find(m => m.lessons.some(l => l.id === recipe.identity.lessonId))!;
    const source = moduleRecord.lessons.find(l => l.id === recipe.identity.lessonId)!;
    const blueprint = createLessonBlueprint(pack, moduleRecord.subjectCode, source, fixtureHashes, [], "2026-10-11T00:00:00Z");
    expect(() => createEnrichmentPreview(pack, blueprint, recipe)).toThrow("Expected initial result");
  });
});
