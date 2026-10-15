import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { MAX_TRACK_PACK_BYTES } from "../../src/features/import/application/import-request";
import { validateTrackPack } from "../../src/features/import/application/track-pack-validation";
import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { HISTORY_GEOGRAPHY_MISCONCEPTION_CORRECTIONS } from "../gh-import/history-geography-corrections";
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

type SourceRequest = Record<string, unknown> & { id: string };
type SuppressedBlock = {
  id: string;
  sourceType: "IMAGE_REQUEST" | "COMPONENT_REQUEST";
  sourceTitle: string;
  requestRef: string;
  status: string;
  sourceHash: string;
  removedVisibleText: string;
  request: SourceRequest;
};
function isRequestBlock(block: z.infer<typeof ghBlock>): block is z.infer<typeof ghBlock> & { type: "IMAGE_REQUEST" | "COMPONENT_REQUEST"; requestRef: string; status: string } {
  return (block.type === "IMAGE_REQUEST" || block.type === "COMPONENT_REQUEST") && Boolean(block.requestRef && block.status);
}
function asRecord(value: unknown): Record<string, unknown> {
  assert(value && typeof value === "object" && !Array.isArray(value), "Expected object metadata");
  return value as Record<string, unknown>;
}
function metadataForBlock(block: SuppressedBlock) {
  return { id: block.id, sourceType: block.sourceType, sourceTitle: block.sourceTitle, requestRef: block.requestRef, status: block.status, sourceHash: block.sourceHash, removedVisibleText: block.removedVisibleText, request: block.request };
}

export function loadGhInputs(root: string) {
  const sourceRoot = resolve(root, GH_SOURCE);
  const requestRows = [
    ...readJson(resolve(sourceRoot, "MEDIA-PRODUCTION/DETERMINISTIC-ASSET-QUEUE.json")) as SourceRequest[],
    ...readJson(resolve(sourceRoot, "MEDIA-PRODUCTION/ANTIGRAVITY-QUEUE.json")) as SourceRequest[],
  ];
  const requests = new Map(requestRows.map(row => [row.id, row]));
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
    const corrections = HISTORY_GEOGRAPHY_MISCONCEPTION_CORRECTIONS[lessonId];
    const misconceptionBlock = original.lesson.blocks.find(block => block.title === "Erros que custam ponto");
    assert(misconceptionBlock && misconceptionBlock.items, `Missing misconception block ${lessonId}`);
    assert.equal(misconceptionBlock.items.length, corrections?.length, `Misconception correction count ${lessonId}`);
    const suppressedBlocks: SuppressedBlock[] = original.lesson.blocks.filter(isRequestBlock).map(block => {
      const request = requests.get(block.requestRef);
      assert(request, `Missing request metadata ${block.requestRef}`);
      return {
        id: block.id,
        sourceType: block.type,
        sourceTitle: block.title,
        requestRef: block.requestRef,
        status: block.status,
        sourceHash: hashCanonicalJson(block),
        removedVisibleText: block.type === "IMAGE_REQUEST" ? `Ilustração pendente: ${block.requestRef}.` : "Componente determinístico pendente de implementação e validação.",
        request,
      };
    });
    const blocks = original.lesson.blocks.filter(block => !isRequestBlock(block)).map(block => {
      const sourceType = block.type;
      const sourceHash = hashCanonicalJson(block);
      const sourceItems = block.items;
      const projectedItems = block.id === misconceptionBlock.id
        ? sourceItems!.map((claim, position) => `\u274C ${claim}\n\u2705 ${corrections[position]}`)
        : sourceItems;
      return {
        ...block,
        ...(projectedItems ? { items: projectedItems } : {}),
        reasoning: Array.isArray(block.reasoning) ? block.reasoning.join("\n\n") : block.reasoning,
        answerGuide: typeof block.answerGuide === "string" ? { mustMention: [block.answerGuide] } : block.answerGuide,
        type: (block.type === "COMPONENT_REQUEST" ? "DETERMINISTIC_COMPONENT_REQUEST" : block.type) as Exclude<typeof block.type, "COMPONENT_REQUEST"> | "DETERMINISTIC_COMPONENT_REQUEST",
        editorialSourceHash: sourceHash,
        editorialSourceType: sourceType,
      };
    });
    const pack: ProjectedPack = { lesson: { ...original.lesson, blocks }, questions: original.questions };
    return { lessonId, sourceHash: sha256(bytes), original, pack, suppressedBlocks };
  });
  const inputs: EditorialInputs = { sourceRoot, packs: originals, library: sourceLibrarySchema.parse(readJson(resolve(sourceRoot, "GH-SOURCE-LIBRARY.json"))), conceptMap: conceptMapSchema.parse(readJson(resolve(root, GH_MAP))) };
  return { inputs, originals };
}

export function buildGhPack(root: string, lessonIds: string[], snapshotVersion: number) {
  const { inputs, originals } = loadGhInputs(root);
  const result = buildEditorialPack(root, lessonIds, snapshotVersion, inputs, GH_PROFILE);
  for (const { lessonId, original, suppressedBlocks } of originals.filter(row => lessonIds.includes(row.lessonId))) {
    const lesson = result.pack.track.modules.flatMap(module => module.lessons).find(row => row.id === lessonId);
    assert(lesson, `Missing projected Lesson ${lessonId}`);
    for (const suppressed of suppressedBlocks) {
      const sourceIndex = original.lesson.blocks.findIndex(block => block.id === suppressed.id);
      const anchorSource = [...original.lesson.blocks.slice(0, sourceIndex)].reverse().find(block => !isRequestBlock(block))
        ?? original.lesson.blocks.slice(sourceIndex + 1).find(block => !isRequestBlock(block));
      assert(anchorSource, `No metadata block for ${suppressed.id}`);
      const anchor: (typeof lesson.blocks)[number] | undefined = lesson.blocks.find(block => block.id === anchorSource.id);
      assert(anchor, `Missing metadata anchor ${anchorSource.id}`);
      const payload = { ...anchor.payload };
      const editorial = { ...asRecord(payload.editorial) };
      const currentMetadata = editorial.metadata ? asRecord(editorial.metadata) : {};
      const omitted = Array.isArray(currentMetadata.omittedSourceBlocks) ? currentMetadata.omittedSourceBlocks : [];
      editorial.metadata = { ...currentMetadata, omittedSourceBlocks: [...omitted, metadataForBlock(suppressed)] };
      anchor.payload = { ...payload, editorial };
    }
  }
  const validation = validateTrackPack(result.pack);
  assert(validation.ok, validation.ok ? "" : JSON.stringify(validation.issues));
  const byteLength = Buffer.byteLength(JSON.stringify(result.pack));
  assert(byteLength <= MAX_TRACK_PACK_BYTES, `History/Geography Pack exceeds importer limit: ${byteLength}`);
  return { ...result, contentHash: validation.contentHash, byteLength, originals };
}
