import { describe, expect, it } from "vitest";
import { z } from "zod";
import { renderToStaticMarkup } from "react-dom/server";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { LessonBlockList } from "@/features/lessons/blocks";
import { validateTrackPack } from "@/features/import/api";
import { loadBlueprintCorpus } from "../../tools/estudisc-content-studio/blueprint-sources";
import { createLessonBlueprint } from "../../tools/estudisc-content-studio/blueprint-policy";
import { createEnrichmentPreview } from "../../tools/estudisc-content-studio/enrichment";
import { enrichmentRecipeSchema } from "../../tools/estudisc-content-studio/enrichment-contracts";
import tickets from "../../tools/estudisc-content-studio/recipes/ticket-price-linear.v1.json";
import direct from "../../tools/estudisc-content-studio/recipes/direct-proportion-linear.v1.json";
import percentages from "../../tools/estudisc-content-studio/recipes/percentage-applications.v1.json";

const pack = loadBlueprintCorpus(process.cwd()).find(s => s.pack.track.id === tickets.identity.trackId)!.pack;
const hashes = { corpusHash: "a".repeat(64), dependencyHash: "b".repeat(64), policyHash: "c".repeat(64), assetHash: "d".repeat(64) };
function context(recipe: typeof tickets | typeof direct | typeof percentages) {
  const moduleRecord = pack.track.modules.find(m => m.lessons.some(l => l.id === recipe.identity.lessonId))!;
  const source = moduleRecord.lessons.find(l => l.id === recipe.identity.lessonId)!;
  return { source, blueprint: createLessonBlueprint(pack, moduleRecord.subjectCode, source, hashes, [], "2026-10-07T12:00:00Z") };
}
describe("source-defined bounded linear enrichment", () => {
  it.each([tickets, direct, percentages])("retains every source field and immutable Question for $identity.lessonId", recipe => {
    const { source, blueprint } = context(recipe), sourceHash = hashCanonicalJson(pack);
    const preview = createEnrichmentPreview(pack, blueprint, recipe);
    const originalBlocks = preview.lesson.blocks.filter(b => source.blocks.some(old => old.id === b.id));
    expect({ ...preview.lesson, version: source.version, status: source.status, blocks: originalBlocks }).toEqual(source);
    const candidate = structuredClone(pack);
    for (const m of candidate.track.modules) m.lessons = m.lessons.map(l => l.id === source.id ? preview.lesson : l);
    expect(validateTrackPack(candidate).ok).toBe(true);
    const markup = renderToStaticMarkup(<LessonBlockList blocks={preview.lesson.blocks.map(b => ({ stableId: b.id, type: b.type, payload: b.payload }))}/>);
    expect(markup).not.toContain("Bloco inválido");
    expect(preview.questionReferences).toHaveLength(recipe.identity.lessonId === "MAT-08" ? 10 : 8);
    for (const ref of preview.questionReferences) expect(ref.hash).toBe(hashCanonicalJson(pack.questions.find(q => q.id === ref.id)));
    expect(hashCanonicalJson(pack)).toBe(sourceHash);
    for (const addition of recipe.additions) {
      const index = preview.lesson.blocks.findIndex(b => b.id === addition.afterBlockId);
      expect(preview.lesson.blocks[index + 1].id).toBe(addition.newBlockId);
    }
  });
  it("rejects arbitrary models, extra formula fields, invalid ranges/steps and wrong source arithmetic", () => {
    const { blueprint } = context(tickets), parameters = tickets.additions[0].parameters;
    const changes = [
      { parameters: { ...parameters, mode: "quadratic" } }, { parameters: { ...parameters, formula: "eval(input)" } },
      { parameters: { ...parameters, max: 0 } }, { parameters: { ...parameters, initial: 9.5 } },
      { parameters: { ...parameters, step: 0 } }, { parameters: { ...parameters, initial: 21 } },
      { parameters: { ...parameters, slope: Infinity } }, { expectedInitialResult: 150 }
    ];
    for (const change of changes) expect(() => createEnrichmentPreview(pack, blueprint, { ...tickets, additions: [{ ...tickets.additions[0], ...change }] })).toThrow();
    expect(() => z.toJSONSchema(enrichmentRecipeSchema, { io: "input" })).not.toThrow();
  });
  it("renders source quantities/units and a baseline labelled input for each independent model", () => {
    const { blueprint } = context(direct), preview = createEnrichmentPreview(pack, blueprint, direct);
    const markup = renderToStaticMarkup(<LessonBlockList blocks={preview.newBlocks.map(b => ({ stableId: b.id, type: b.type, payload: b.payload }))}/>);
    expect(markup).toContain("Preço: 63 reais"); expect(markup).toContain("Páginas: 770 páginas");
    expect(markup).toContain("Quantidade de cadernos"); expect(markup).toContain("Tempo de impressão");
    expect(markup.match(/inputMode="decimal"/g)).toHaveLength(2);
    expect(markup).not.toContain('type="range"'); expect(markup).not.toContain("Registrar tentativa");
    // Distinct complete authored examples independently confirm the constant rates.
    expect(60 / 4).toBe(135 / 9); expect(28 / 4).toBe(63 / 9); expect(420 / 6).toBe(770 / 11);
  });
});
