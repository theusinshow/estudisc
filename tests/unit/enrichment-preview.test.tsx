import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { validateTrackPack } from "@/features/import/api";
import { LessonBlockList } from "@/features/lessons/blocks";
import { loadBlueprintCorpus } from "../../tools/estudisc-content-studio/blueprint-sources";
import { createLessonBlueprint } from "../../tools/estudisc-content-studio/blueprint-policy";
import { createEnrichmentPreview, prepareEnrichmentPreview } from "../../tools/estudisc-content-studio/enrichment";
import { Studio } from "../../tools/estudisc-content-studio/workspace";
import { enrichmentRecipeSchema } from "../../tools/estudisc-content-studio/enrichment-contracts";
import recipe from "../../tools/estudisc-content-studio/recipes/percentage-calculation.v1.json";

const root = process.cwd(), pack = loadBlueprintCorpus(root)[0].pack;
const moduleRecord = pack.track.modules.find(m => m.lessons.some(l => l.id === recipe.identity.lessonId))!;
const source = moduleRecord.lessons.find(l => l.id === recipe.identity.lessonId)!;
const hashes = { corpusHash: "a".repeat(64), dependencyHash: "b".repeat(64), policyHash: "c".repeat(64), assetHash: "d".repeat(64) };
const blueprint = createLessonBlueprint(pack, moduleRecord.subjectCode, source, hashes, [], "2026-10-07T12:00:00Z");

describe("source-bound enrichment review preview", () => {
  it("preserves authored content and twelve immutable Question references in an isolated next-version candidate", () => {
    const originalHash = hashCanonicalJson(pack), result = createEnrichmentPreview(pack, blueprint, recipe);
    expect(result.lesson.id).toBe(source.id); expect(result.lesson.version).toBe(5); expect(result.lesson.status).toBe("draft");
    expect(result.lesson.activities).toEqual(source.activities);
    expect(result.lesson.exitTicketQuestionIds).toEqual(source.exitTicketQuestionIds);
    expect(result.lesson.blocks.filter(b => b.id !== recipe.additions[0].newBlockId)).toEqual(source.blocks);
    const anchor = result.lesson.blocks.findIndex(b => b.id === recipe.additions[0].afterBlockId);
    expect(result.lesson.blocks[anchor + 1]).toMatchObject({ id: recipe.additions[0].newBlockId, type: "numeric-explorer", conceptIds: ["MAT.PCT.CALCULATE"], payload: { initialValue: 275, initialPercentage: 16 } });
    expect(result.questionReferences).toHaveLength(12);
    for (const ref of result.questionReferences) expect(ref.hash).toBe(hashCanonicalJson(pack.questions.find(q => q.id === ref.id)!));
    expect(JSON.stringify(result.questionReferences)).not.toMatch(/"answer"|"choices"|"assets"|"stem"/);
    const candidate = structuredClone(pack);
    candidate.track.modules.find(m => m.id === moduleRecord.id)!.lessons.splice(moduleRecord.lessons.indexOf(source), 1, result.lesson);
    expect(validateTrackPack(candidate).ok).toBe(true);
    result.lesson.blocks[0].payload.content = "test mutation";
    expect(hashCanonicalJson(pack)).toBe(originalHash);
  });

  it("rejects stale/forged identities, goals, anchors, source hashes, collisions and unsupported models", () => {
    expect(() => z.toJSONSchema(enrichmentRecipeSchema, { io: "input" })).not.toThrow();
    const variants = [
      { ...recipe, sourceLessonHash: "0".repeat(64) }, { ...recipe, newVersion: 4 },
      { ...recipe, identity: { ...recipe.identity, lessonVersion: 3 } }, { ...recipe, approved: true },
      ...[{ sourceBlockHash: "0".repeat(64) }, { sourceQuote: "A fabricated quote that is absent" }, { objective: "Invented goal" }, { conceptId: "MAT.PCT.DISCOUNT" },
        { newBlockId: source.blocks[0].id }, { expectedInitialResult: 45 }, { parameters: { mode: "linear", initialValue: 275, initialPercentage: 16 } }].map(change => ({ ...recipe, additions: [{ ...recipe.additions[0], ...change }] })),
      { ...recipe, additions: [recipe.additions[0], recipe.additions[0]] }
    ];
    for (const changed of variants) expect(() => createEnrichmentPreview(pack, blueprint, changed)).toThrow();
    expect(() => createEnrichmentPreview(pack, { ...blueprint, sourceHash: "0".repeat(64) }, recipe)).toThrow("actual source");
    expect(() => createEnrichmentPreview(pack, { ...blueprint, recommendedBlocks: [] }, recipe)).toThrow("not proposed");
  });

  it("reuses the existing renderer and clearly computes an exploratory part without grade/Attempt controls", () => {
    const result = createEnrichmentPreview(pack, blueprint, recipe);
    const markup = renderToStaticMarkup(<LessonBlockList blocks={result.newBlocks.map(b => ({ stableId: b.id, type: b.type, payload: b.payload }))}/>);
    const document = new DOMParser().parseFromString(markup, "text/html");
    expect(document.querySelector("output")?.textContent).toBe("16% de 275 = 44");
    expect(document.querySelectorAll("input")).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(/inválido|registrar tentativa|domínio confirmado/i);
  });

  it("retains exact review-request hashes, skips unchanged files and repairs invented review status", () => {
    const studio = new Studio(root, mkdtempSync(join(root, ".local/enrichment-tests-")));
    const first = prepareEnrichmentPreview(studio, recipe);
    expect(first.written).toBe(4); expect(first.reviewRequest.gate).toBe("REVIEW_REQUIRED");
    expect(first.reviewRequest.blueprintReviewState).toBe("UNREVIEWED");
    expect(first.reviewRequest.dimensions).toHaveLength(7);
    expect(first.reviewRequest.inputHashes.preview).toBe(hashCanonicalJson(first.preview.lesson));
    const second = prepareEnrichmentPreview(studio, recipe);
    expect(second.written).toBe(0); expect(second.key).toBe(first.key);
    const file = join(first.directory, "review-request.json");
    writeFileSync(file, JSON.stringify({ ...first.reviewRequest, gate: "APPROVED", reviewerId: "invented-reviewer" }));
    expect(prepareEnrichmentPreview(studio, recipe).written).toBe(1);
    expect(JSON.parse(readFileSync(file, "utf8")).gate).toBe("REVIEW_REQUIRED");
    const changed = structuredClone(recipe); changed.additions[0].parameters.initialPercentage = 20; changed.additions[0].expectedInitialResult = 55;
    expect(prepareEnrichmentPreview(studio, changed).key).not.toBe(first.key);
    expect(() => prepareEnrichmentPreview(new Studio(root, "public/enrichment-tests"), recipe)).toThrow("ignored authoring");
  });
});
