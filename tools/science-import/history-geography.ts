import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { conceptMapSchema, editorialBlockSchema, editorialPackSchema, sourceLibrarySchema } from "./contracts";
import { buildEditorialPack, readJson, sha256, type EditorialInputs, type EditorialProfile, type ProjectedPack } from "./mapper";

export const GH_SOURCE = "packs/drafts/ifsc-2027-history-geography/source";
export const GH_MAP = ".estudisc-agent-context/history-geography/CONCEPT-MAP.json";
export const GH_PILOT = ["GH-02", "GH-08", "GH-15", "GH-21", "GH-24", "GH-30", "GH-44", "GH-49"];
export const GH_BATCHES = Array.from({ length: 6 }, (_, batch) => Array.from({ length: batch === 5 ? 9 : 8 }, (_, index) => `GH-${String(batch * 8 + index + 1).padStart(2, "0")}`));
export const GH_PROFILE: EditorialProfile = { trackId: "ifsc-2027-history-geography", trackTitle: "IFSC 2027 - Geografia e História", moduleId: "gh", moduleTitle: "Geografia e História", subjectCode: "GH", packId: "vecta.ifsc-2027.history-geography.local-v2", contentVersion: 2, generationRunId: "vecta.history-geography.editorial-v2", officialSourceId: "SRC-IFSC-GH-001", metadataKey: "historyGeographyIntegration", sourceMetadataKey: "historyGeographyEditorialSource", estimatedMinutesIsIntegrationDefault: true };
const ghBlock = editorialBlockSchema.extend({ reasoning: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(), answerGuide: z.union([editorialBlockSchema.shape.answerGuide.unwrap(), z.string().min(1)]).optional(), type: z.enum([...editorialBlockSchema.shape.type.options, "COMPONENT_REQUEST"]) });
export const ghPackSchema = editorialPackSchema.extend({
  lesson: editorialPackSchema.shape.lesson.extend({ lessonId: z.string().regex(/^GH-\d{2}$/), subject: z.literal("GH"), status: z.literal("APPROVED_CONTENT_PENDING_INTEGRATION_V2"), editorialNotes: z.union([z.string().min(1), z.array(z.string().min(1))]), concepts: z.array(editorialPackSchema.shape.lesson.shape.concepts.element).min(1).max(6), blocks: z.array(ghBlock) }),
  questions: z.array(editorialPackSchema.shape.questions.element.extend({ cognitiveOperation: z.enum([...editorialPackSchema.shape.questions.element.shape.cognitiveOperation.options, "RECALL", "SOURCE_ANALYSIS"]), provenance: z.literal("ORIGINAL_VECTA_GROUNDED_GH_V2") })).length(8)
});
export function loadGhInputs(root: string) {
  const sourceRoot = resolve(root, GH_SOURCE);
  const originals = Array.from({ length: 49 }, (_, index) => {
    const lessonId = `GH-${String(index + 1).padStart(2, "0")}`;
    const bytes = readFileSync(resolve(sourceRoot, `workspace/${lessonId}/approved/pack.json`));
    const original = ghPackSchema.parse(JSON.parse(bytes.toString("utf8")));
    assert.equal(original.lesson.lessonId, lessonId);
    for (const question of original.questions) {
      assert.deepEqual(new Set(question.options.map(option => option.key)), new Set(["A", "B", "C", "D", "E"]));
      assert.equal(question.options.filter(option => option.key === question.correctOption).length, 1);
      assert(question.conceptIds.every(id => original.lesson.concepts.some(concept => concept.id === id)), `Unknown Concept ${question.id}`);
    }
    const pack: ProjectedPack = { lesson: { ...original.lesson, blocks: original.lesson.blocks.map(block => ({ ...block, reasoning: Array.isArray(block.reasoning) ? block.reasoning.join("\n\n") : block.reasoning, answerGuide: typeof block.answerGuide === "string" ? { mustMention: [block.answerGuide] } : block.answerGuide, type: block.type === "COMPONENT_REQUEST" ? "DETERMINISTIC_COMPONENT_REQUEST" as const : block.type, editorialSourceHash: hashCanonicalJson(block), editorialSourceType: block.type })) }, questions: original.questions };
    return { lessonId, sourceHash: sha256(bytes), original, pack };
  });
  const inputs: EditorialInputs = { sourceRoot, packs: originals, library: sourceLibrarySchema.parse(readJson(resolve(sourceRoot, "GH-SOURCE-LIBRARY.json"))), conceptMap: conceptMapSchema.parse(readJson(resolve(root, GH_MAP))) };
  return { inputs, originals };
}
export function buildGhPack(root: string, lessonIds: string[], snapshotVersion: number) {
  const { inputs, originals } = loadGhInputs(root);
  return { ...buildEditorialPack(root, lessonIds, snapshotVersion, inputs, GH_PROFILE), originals };
}
