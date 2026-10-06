import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { editorialPackSchema, editorialBlockSchema, conceptMapSchema, sourceLibrarySchema } from "../science-import/contracts";
import { buildEditorialPack, readJson, sha256, validateConceptMap, type EditorialInputs } from "../science-import/mapper";
import { trackPackV2Schema } from "../../src/features/import/application/track-pack-v2-schema";
import { validateTrackPack } from "../../src/features/import/application/track-pack-validation";
import { MAX_TRACK_PACK_BYTES } from "../../src/features/import/application/import-request";

export const SOURCE = "packs/drafts/ifsc-2027-gh/source";
export const PACK = "packs/drafts/ifsc-2027-gh/gh.pack.json";
export const OUTPUT = ".local/gh-integration-final";
export const PILOT = ["GH-02", "GH-08", "GH-15", "GH-21", "GH-24", "GH-30", "GH-44", "GH-49"];
export const ALL = Array.from({ length: 49 }, (_, index) => `GH-${String(index + 1).padStart(2, "0")}`);
export const BATCHES = Array.from({ length: 5 }, (_, index) => ALL.slice(index * 10, (index + 1) * 10).filter(id => !PILOT.includes(id)));
export const runtimeId = (id: string) => id.replace(/^GH-/, "GH-V2-");
const text = z.string().min(1);
export const ghBlockSchema = editorialBlockSchema.extend({
  type: z.enum([...editorialBlockSchema.shape.type.options, "COMPONENT_REQUEST"]),
  reasoning: z.union([text, z.array(text)]).optional(),
  answerGuide: z.union([text, z.object({ mustMention: z.array(text) }).strict()]).optional()
});
export const ghPackSchema = editorialPackSchema.extend({
  lesson: editorialPackSchema.shape.lesson.extend({ lessonId: z.string().regex(/^GH-\d{2}$/), subject: z.literal("GH"), status: z.literal("APPROVED_CONTENT_PENDING_INTEGRATION_V2"), concepts: z.array(editorialPackSchema.shape.lesson.shape.concepts.element).min(1), blocks: z.array(ghBlockSchema).min(1), editorialNotes: z.array(text) }),
  questions: z.array(editorialPackSchema.shape.questions.element.extend({ cognitiveOperation: z.enum(["RECALL", "ANALYZE", "APPLY", "TRANSFER", "SOURCE_ANALYSIS", "EVALUATE"]), provenance: z.literal("ORIGINAL_VECTA_GROUNDED_GH_V2") })).length(8)
}).superRefine((pack, context) => {
  const fail = (message: string, path: (string | number)[]) => context.addIssue({ code: "custom", message, path });
  for (const [index, q] of pack.questions.entries()) {
    if (q.options.map(o => o.key).join("") !== "ABCDE" || q.options.filter(o => o.key === q.correctOption).length !== 1) fail("Expected A-E options and exactly one valid answer", ["questions", index]);
    if (new Set(q.conceptIds).size !== q.conceptIds.length || q.conceptIds.some(id => !pack.lesson.concepts.some(c => c.id === id))) fail("Unknown or repeated Concept reference", ["questions", index, "conceptIds"]);
  }
});
export type GhPack = z.infer<typeof ghPackSchema>;
const REUSE: Record<string, string> = { "GH-01-CON-01": "GH.GEO.SPACE", "GH-04-CON-03": "GH.HIST.MEMORY", "GH-15-CON-01": "GH.BR.SLAVERY.RESISTANCE" };
export function sourcePins(root = process.cwd()) {
  const files: Record<string, string> = {};
  function visit(relative: string) {
    for (const entry of readdirSync(join(root, SOURCE, relative), { withFileTypes: true })) {
      const path = [relative, entry.name].filter(Boolean).join("/");
      if (entry.isDirectory()) visit(path); else files[path] = sha256(readFileSync(join(root, SOURCE, path)));
    }
  }
  visit(""); return files;
}
export function loadGh(root = process.cwd()) {
  const sourceRoot = join(root, SOURCE);
  const manifest = z.object({ package: z.literal("VECTA-GH-CONTENT-IFSC-2027-1-v2"), lessonCount: z.literal(49), questionCount: z.literal(392), workspaces: z.array(text), pilotLessons: z.array(text), rules: z.object({ noAutoPublish: z.literal(true), conceptMappingRequired: z.literal(true), schemaValidationRequired: z.literal(true), licenseReviewRequired: z.literal(true), historicalAuthenticityGate: z.literal(true) }).strict() }).passthrough().parse(readJson(join(sourceRoot, "IMPORT-MANIFEST.json")));
  assert.deepEqual(manifest.workspaces, ALL); assert.deepEqual(manifest.pilotLessons, PILOT);
  const originals = ALL.map(lessonId => {
    const bytes = readFileSync(join(sourceRoot, `workspace/${lessonId}/approved/pack.json`));
    const pack = ghPackSchema.parse(JSON.parse(bytes.toString("utf8")));
    assert.equal(pack.lesson.lessonId, lessonId);
    assert.equal(pack.lesson.concepts.length, lessonId === "GH-06" ? 5 : 6);
    for (const [kind, ids] of Object.entries({ blocks: pack.lesson.blocks.map(b => b.id), concepts: pack.lesson.concepts.map(c => c.id), questions: pack.questions.map(q => q.id) })) {
      assert.equal(new Set(ids).size, ids.length, `Duplicate ${kind} in ${lessonId}`);
      assert(ids.every(id => id.startsWith(`${lessonId}-`)), `Foreign ${kind} ID in ${lessonId}`);
    }
    for (const question of pack.questions) {
      assert.deepEqual(question.options.map(option => option.key), ["A", "B", "C", "D", "E"], question.id);
      assert.equal(question.options.filter(option => option.key === question.correctOption).length, 1, question.id);
      assert.equal(new Set(question.conceptIds).size, question.conceptIds.length);
      assert(question.conceptIds.every(id => pack.lesson.concepts.some(c => c.id === id)), `Missing Concept ${question.id}`);
    }
    return { lessonId, sourceHash: sha256(bytes), pack };
  });
  const library = sourceLibrarySchema.parse(readJson(join(sourceRoot, "GH-SOURCE-LIBRARY.json")));
  assert.equal(library.sources.length, 85); assert.equal(new Set(library.sources.map(s => s.id)).size, 85);
  const existingPacks = ["packs/releases/ifsc-week-1.pack.json", "packs/drafts/ifsc-2027-science/science.pack.json"].map(path => trackPackV2Schema.parse(readJson(join(root, path))));
  const existing = new Map(existingPacks.flatMap(p => p.track.modules.flatMap(m => m.lessons.flatMap(l => l.concepts))).map(c => [c.id, c]));
  const conceptMap = conceptMapSchema.parse({ version: 1, entries: originals.flatMap(row => row.pack.lesson.concepts.map(c => ({ editorialId: c.id, canonicalId: REUSE[c.id] ?? c.id, disposition: REUSE[c.id] ? "existing" : "intentional_new", reason: REUSE[c.id] ? "Compatible name and atomic target; preserve canonical definition." : "No safe equivalent with matching name and target; retain source atom pending human taxonomy review.", ...(REUSE[c.id] ? { existingTitle: existing.get(REUSE[c.id])?.title } : {}) }))) });
  validateConceptMap(conceptMap, originals.flatMap(row => row.pack.lesson.concepts.map(c => c.id)), new Set(existing.keys()));
  const authentic = z.array(z.object({ lessonId: text, sourceRef: text, title: text, url: z.string().nullable(), action: z.literal("REVIEW_FOR_LINK_OR_LICENSED_EMBED"), status: z.literal("PENDING_LICENSE_REVIEW") }).strict()).length(42).parse(readJson(join(sourceRoot, "MEDIA-PRODUCTION/AUTHENTIC-MEDIA-QUEUE.json")));
  const deterministic = z.array(z.object({ id: text, lessonId: text, type: z.literal("DETERMINISTIC_EDUCATIONAL_COMPONENT"), brief: text, preferredImplementation: z.array(text), requiresSourceValidation: z.literal(true), status: z.literal("PENDING") }).strict()).length(29).parse(readJson(join(sourceRoot, "MEDIA-PRODUCTION/DETERMINISTIC-ASSET-QUEUE.json")));
  const illustrations = z.array(z.object({ id: text, lessonId: text, blockId: text, type: z.literal("EDUCATIONAL_ILLUSTRATION"), factualReviewStatus: z.literal("PENDING"), visualReviewStatus: z.literal("PENDING"), factualConstraints: z.array(text), forbiddenElements: z.array(text) }).passthrough()).length(6).parse(readJson(join(sourceRoot, "MEDIA-PRODUCTION/ANTIGRAVITY-QUEUE.json")));
  for (const row of originals) for (const ref of [...row.pack.lesson.sourceRefs, ...row.pack.lesson.mediaRefs, ...row.pack.lesson.blocks.flatMap(b => b.mediaRefs ?? [])]) assert(library.sources.some(s => s.id === ref), `Unknown source ${ref}`);
  for (const request of authentic) assert(ALL.includes(request.lessonId) && library.sources.some(s => s.id === request.sourceRef), "Unknown authentic media reference");
  const requests = [...deterministic, ...illustrations];
  assert.equal(new Set(requests.map(r => r.id)).size, requests.length);
  for (const request of requests) assert(originals.find(r => r.lessonId === request.lessonId)?.pack.lesson.blocks.some(b => b.requestRef === request.id), `Orphan request ${request.id}`);
  for (const row of originals) {
    for (const b of row.pack.lesson.blocks.filter(b => ["IMAGE_REQUEST", "COMPONENT_REQUEST"].includes(b.type))) assert(requests.some(r => r.id === b.requestRef && r.lessonId === row.lessonId), `Missing request ${b.id}`);
    assert.deepEqual(row.pack.lesson.imageRequestRefs, row.pack.lesson.blocks.filter(b => b.type === "IMAGE_REQUEST").map(b => b.requestRef));
  }
  return { sourceRoot, originals, library, conceptMap, existing, authentic, deterministic, illustrations };
}
export function buildGhPack(ids: string[], version: number, root = process.cwd()) {
  const gh = loadGh(root);
  const inputs: EditorialInputs = { sourceRoot: gh.sourceRoot, conceptMap: gh.conceptMap,
    // Preserve URLs in the original sidecar only; no pending documentary media is linked or embedded.
    library: { ...gh.library, sources: gh.library.sources.map(s => ({ ...s, url: null })) },
    packs: gh.originals.map(row => ({ ...row, pack: { lesson: { ...row.pack.lesson, blocks: row.pack.lesson.blocks.map(b => ({ ...b, type: b.type === "COMPONENT_REQUEST" ? "DETERMINISTIC_COMPONENT_REQUEST" as const : b.type, reasoning: Array.isArray(b.reasoning) ? b.reasoning.join("\n\n") : b.reasoning, answerGuide: typeof b.answerGuide === "string" ? { mustMention: [b.answerGuide] } : b.answerGuide, request: b.type === "COMPONENT_REQUEST" ? gh.deterministic.find(r => r.id === b.requestRef)?.brief : undefined })) }, questions: row.pack.questions } })) };
  const result = buildEditorialPack(root, ids, version, inputs, { contentVersion: 2, estimatedMinutesIsIntegrationDefault: true, subjectCode: "GH", packId: "vecta.ifsc-2027.gh.local-v2", trackId: "ifsc-2027-gh-v2", trackTitle: "IFSC 2027 - Geografia e História", moduleId: "gh-v2", moduleTitle: "Geografia e História", generationRunId: "vecta.gh.editorial-v2", metadataKey: "ghIntegration", sourceMetadataKey: "ghEditorialSource", officialSourceId: "SRC-IFSC-GH-001", compactBlockMetadata: true });
  for (const lesson of result.pack.track.modules.flatMap(m => m.lessons)) {
    const source = gh.originals.find(r => r.lessonId === lesson.id)!.pack.lesson;
    lesson.id = runtimeId(lesson.id); lesson.version = 3;
    for (const concept of lesson.concepts) if (gh.existing.has(concept.id)) Object.assign(concept, gh.existing.get(concept.id));
    for (const block of lesson.blocks) {
      assert(source.blocks.some(b => b.id === block.id));
      block.id = runtimeId(block.id);
    }
    for (const a of lesson.activities) { a.id = runtimeId(a.id); a.questionId = runtimeId(a.questionId!); a.prompt = a.questionId; }
  }
  for (const question of result.pack.questions) question.id = runtimeId(question.id);
  for (const source of result.pack.sources) {
    source.metadata = { documentaryEmbeddingAllowed: false };
  }
  const integration = result.pack.track.metadata.ghIntegration as Record<string, unknown>;
  Object.assign(integration, { status: "preview", historicalAuthenticityGate: true, licenseReviewPending: true, mediaPending: { authentic: 42, deterministic: 29, illustrations: 6 }, lessonIdMap: Object.fromEntries(ids.map(id => [id, runtimeId(id)])), taxonomyReviewPending: true });
  const pack = trackPackV2Schema.parse(result.pack);
  const validation = validateTrackPack(pack); assert(validation.ok, validation.ok ? "" : JSON.stringify(validation.issues));
  const byteLength = Buffer.byteLength(JSON.stringify(pack)) + 1; assert(byteLength <= MAX_TRACK_PACK_BYTES, `GH Pack exceeds 1 MiB: ${byteLength}`);
  return { pack, gh, contentHash: validation.contentHash, byteLength };
}
