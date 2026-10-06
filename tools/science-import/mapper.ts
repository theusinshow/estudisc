import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { trackPackV2Schema, type TrackPackV2 } from "../../src/features/import/application/track-pack-v2-schema";
import { validateTrackPack } from "../../src/features/import/application/track-pack-validation";
import { MAX_TRACK_PACK_BYTES } from "../../src/features/import/application/import-request";
import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { conceptMapSchema, editorialPackSchema, mediaAssetsSchema, sourceLibrarySchema, type ConceptMap, type EditorialBlock, type EditorialPack, type MediaAssets } from "./contracts";

import { SCIENCE_SOURCE_ROOT } from "./paths";
export const DEFAULT_SOURCE = SCIENCE_SOURCE_ROOT;
export const sha256 = (input: string | Buffer) => createHash("sha256").update(input).digest("hex");
export function readJson(path: string): unknown { return JSON.parse(readFileSync(path, "utf8")); }
export function loadInputs(root: string, source = DEFAULT_SOURCE) {
  const sourceRoot = resolve(root, source);
  assert(sourceRoot.startsWith(`${resolve(root)}\\`) || sourceRoot.startsWith(`${resolve(root)}/`), "Source must remain inside repository");
  const packs = Array.from({ length: 40 }, (_, i) => {
    const lessonId = `CIE-${String(i + 1).padStart(2, "0")}`;
    const path = resolve(sourceRoot, `workspace/${lessonId}/approved/pack.json`);
    const raw = readFileSync(path);
    const pack = editorialPackSchema.parse(JSON.parse(raw.toString("utf8")));
    assert.equal(pack.lesson.lessonId, lessonId);
    return { lessonId, sourceHash: sha256(raw), pack };
  });
  const library = sourceLibrarySchema.parse(readJson(resolve(sourceRoot, "SCIENCE-SOURCE-LIBRARY.json")));
  const conceptMap = conceptMapSchema.parse(readJson(resolve(root, ".estudisc-agent-context/CONCEPT-MAP.json")));
  return { sourceRoot, packs, library, conceptMap };
}
const BLOCK_TYPES: Record<EditorialBlock["type"], string> = { HOOK: "note", LEARNING_GOALS: "note", EXPLANATION: "note", CALLOUT: "note", WORKED_EXAMPLE: "worked-example", MEDIA_RECOMMENDATION: "note", SUMMARY: "summary", EXIT_TICKET: "note", IMAGE_REQUEST: "note", DETERMINISTIC_COMPONENT_REQUEST: "note" };
export function mapBlock(block: EditorialBlock & { editorialSourceHash?: string; editorialSourceType?: string }, sources: Map<string, { title: string; url?: string | null }>) {
  const paragraphs = [block.content, ...(block.items ?? []), block.prompt, block.answer, block.reasoning, ...(block.answerGuide?.mustMention ?? [])].filter((value): value is string => typeof value === "string");
  if (block.type === "MEDIA_RECOMMENDATION") for (const ref of block.mediaRefs ?? []) {
    const source = sources.get(ref); assert(source, `Missing media source ${ref}`);
    paragraphs.push(`${source.title}${source.url ? `\n${source.url}` : ""}`);
  }
  if (block.type === "IMAGE_REQUEST") paragraphs.push(`Ilustração pendente: ${block.requestRef}.`);
  if (block.type === "DETERMINISTIC_COMPONENT_REQUEST") paragraphs.push(block.request ?? "", "Componente determinístico pendente de implementação e validação.");
  assert(paragraphs.filter(Boolean).length, `Empty mapped block ${block.id}`);
  // A source sentence repeated verbatim inside another source paragraph stays visible there.
  // Keep all distinct text unchanged, with the complete original arrangement in the sidecar.
  const displayParagraphs = paragraphs.filter((paragraph, index) => paragraph && !paragraphs.some((other, otherIndex) => other.includes(paragraph) && (other.length > paragraph.length || otherIndex < index)));
  return { id: block.id, type: BLOCK_TYPES[block.type], schemaVersion: 1, conceptIds: [], payload: { id: block.id, type: BLOCK_TYPES[block.type], title: block.title, content: displayParagraphs.join("\n\n"), editorial: { id: block.id, type: block.editorialSourceType ?? block.type, sourceHash: block.editorialSourceHash ?? hashCanonicalJson(block) } } };
}
const COGNITIVE_OPERATIONS = { UNDERSTAND: "interpret", ANALYZE: "analyze", APPLY: "apply", TRANSFER: "apply", EVALUATE: "evaluate", RECALL: "recall", SOURCE_ANALYSIS: "analyze" } as const;
export type ProjectedPack = { lesson: Pick<EditorialPack["lesson"], "title" | "concepts" | "sourceRefs" | "mediaRefs"> & { blocks: Array<EditorialBlock & { editorialSourceHash?: string; editorialSourceType?: string }>; estimatedMinutes?: number }; questions: Array<Omit<EditorialPack["questions"][number], "cognitiveOperation" | "provenance"> & { cognitiveOperation: keyof typeof COGNITIVE_OPERATIONS; provenance: string }> };
export type EditorialInputs = Omit<ReturnType<typeof loadInputs>, "packs"> & { packs: { lessonId: string; sourceHash: string; pack: ProjectedPack }[] };
export type EditorialProfile = { trackId: string; trackTitle: string; moduleId: string; moduleTitle: string; subjectCode: string; packId: string; contentVersion: number; questionVersion?: number; editorialSourceVersion?: number; generationRunId: string; officialSourceId: string; metadataKey: string; sourceMetadataKey: string; estimatedMinutesIsIntegrationDefault: boolean; compactBlockMetadata?: boolean };
const SCIENCE_PROFILE: EditorialProfile = { trackId: "ifsc-2027-science", trackTitle: "IFSC 2027 - Ciências", moduleId: "cie", moduleTitle: "Ciências", subjectCode: "CIE", packId: "vecta.ifsc-2027.science.local-v2", contentVersion: 2, generationRunId: "vecta.science.editorial-v2", officialSourceId: "SRC-IFSC-001", metadataKey: "scienceIntegration", sourceMetadataKey: "scienceEditorialSource", estimatedMinutesIsIntegrationDefault: true };
export function buildSciencePack(root: string, lessonIds: string[], snapshotVersion: number, source = DEFAULT_SOURCE, media: MediaAssets = { assets: [] }) {
  return buildEditorialPack(root, lessonIds, snapshotVersion, loadInputs(root, source), SCIENCE_PROFILE, media);
}
export function buildEditorialPack(root: string, lessonIds: string[], snapshotVersion: number, inputs: EditorialInputs, profile: EditorialProfile, media: MediaAssets = { assets: [] }) {
  const conceptMap = new Map(inputs.conceptMap.entries.map(entry => [entry.editorialId, entry]));
  const canonical = (id: string) => { const entry = conceptMap.get(id); assert(entry, `Unmapped Concept ${id}`); return entry.canonicalId; };
  const selected = inputs.packs.filter(row => lessonIds.includes(row.lessonId));
  assert.equal(selected.length, new Set(lessonIds).size, "Unknown or duplicate lesson selection");
  const sources = new Map(inputs.library.sources.map(row => [row.id, row]));
  const assets = new Map(mediaAssetsSchema.parse(media).assets.map(asset => [asset.requestId, asset]));
  const usedSourceIds = new Set(selected.flatMap(row => [...row.pack.lesson.sourceRefs, ...row.pack.lesson.mediaRefs]));
  const questions: TrackPackV2["questions"] = selected.flatMap(({ pack }) => pack.questions.map(question => {
    assert.equal(question.options.filter(option => option.key === question.correctOption).length, 1, `Invalid answer ${question.id}`);
    return { id: question.id, version: profile.questionVersion ?? profile.contentVersion, subjectCode: profile.subjectCode, primaryConceptId: canonical(question.conceptIds[0]), conceptIds: question.conceptIds.map(canonical), type: "multiple_choice" as const,
      difficulty: question.difficulty.toLowerCase() as "foundation" | "direct" | "applied" | "ifsc",
      cognitiveOperations: [COGNITIVE_OPERATIONS[question.cognitiveOperation]],
      stem: question.stem, choices: question.options.map(option => ({ id: option.key, content: option.text, correct: option.key === question.correctOption })), answer: { kind: "multiple_choice" as const, choiceId: question.correctOption }, explanation: question.explanation, sourceIds: pack.lesson.sourceRefs,
      provenance: { type: "generated" as const, generationRunId: profile.generationRunId }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "draft" as const, assets: [], items: [], destinations: [] };
  }));
  const lessons = selected.map(({ lessonId, pack }) => ({ id: lessonId, version: pack.lesson.blocks.some(block => assets.has(block.requestRef ?? (block.type === "DETERMINISTIC_COMPONENT_REQUEST" ? `COMP-${lessonId}-001` : ""))) ? profile.contentVersion + 1 : profile.contentVersion, title: pack.lesson.title, kind: "core" as const, estimatedMinutes: pack.lesson.estimatedMinutes ?? 30, status: "draft" as const,
    concepts: pack.lesson.concepts.map(concept => ({ id: canonical(concept.id), title: concept.name, summary: concept.masteryTarget, importance: "medium" as const })), prerequisiteConceptIds: [],
    // Original learning goals render in their source block; avoid a second prose copy in metadata.
    objectives: [], sourceIds: pack.lesson.sourceRefs, exitTicketQuestionIds: [],
    blocks: pack.lesson.blocks.map(block => {
      const requestId = block.requestRef ?? (block.type === "DETERMINISTIC_COMPONENT_REQUEST" ? `COMP-${lessonId}-001` : undefined);
      const asset = requestId ? assets.get(requestId) : undefined;
      if (!asset) { const mapped = mapBlock(block, sources); return profile.compactBlockMetadata ? { ...mapped, payload: { type: mapped.payload.type, title: mapped.payload.title, content: mapped.payload.content } } : mapped; }
      const assetPath = resolve(root, asset.path); assert(assetPath.startsWith(`${resolve(root)}\\`) || assetPath.startsWith(`${resolve(root)}/`), "Media must remain inside repository");
      const bytes = readFileSync(assetPath); assert.equal(sha256(bytes), asset.sha256, `Media hash changed ${asset.requestId}`);
      return { id: block.id, type: "figure", schemaVersion: 1, conceptIds: [], payload: { id: block.id, type: "figure", src: `data:image/${asset.mime};base64,${bytes.toString("base64")}`, alt: asset.alt, caption: asset.caption, credit: asset.credit, longDescription: asset.longDescription, width: asset.width, height: asset.height, editorial: { id: block.id, type: block.type, sourceHash: hashCanonicalJson(block) }, media: { requestId: asset.requestId, sha256: asset.sha256, status: asset.status } } };
    }), activities: pack.questions.map(question => ({ id: `${question.id}-ACT`, type: "question" as const, conceptIds: question.conceptIds.map(canonical), prompt: question.id, questionId: question.id, config: {} })) }));
  const pack = trackPackV2Schema.parse({ schema: "caderno.track.v2", packId: profile.packId, version: snapshotVersion, language: "pt-BR", sources: inputs.library.sources.filter(row => usedSourceIds.has(row.id)).map(row => ({ id: row.id, title: row.title, type: row.id === profile.officialSourceId ? "official_curriculum" : "reference", locator: { ...(row.url ? { url: row.url } : {}), ...(row.localRef ? { localRef: row.localRef } : {}) }, metadata: Object.fromEntries(Object.entries({ [profile.sourceMetadataKey]: { id: row.id, type: row.type, sourceHash: sha256(JSON.stringify(row)) }, licenseStatus: row.licenseStatus, license: row.license, verificationStatus: row.verificationStatus, notes: row.notes, sourceScopeVerifiedByIntegration: false }).filter(([, value]) => value !== undefined)) })),
    curriculumRequirements: [], conceptPrerequisites: [], questions,
    track: { id: profile.trackId, title: profile.trackTitle, metadata: { [profile.metadataKey]: { status: "draft", sourceLessonVersion: profile.editorialSourceVersion ?? profile.contentVersion, ...(media.assets.length ? { runtimeMediaLessonVersions: Object.fromEntries(lessons.filter(lesson => lesson.version === 3).map(lesson => [lesson.id, 3])) } : {}), humanApprovalRecorded: false, officialMappingVerified: false, estimatedMinutesIsIntegrationDefault: profile.estimatedMinutesIsIntegrationDefault, prerequisiteMappingPending: true, sourceHashes: Object.fromEntries(selected.map(row => [row.lessonId, row.sourceHash])) } }, modules: [{ id: profile.moduleId, title: profile.moduleTitle, subjectCode: profile.subjectCode, lessons }] } });
  const validation = validateTrackPack(pack); assert(validation.ok, validation.ok ? "" : JSON.stringify(validation.issues.slice(0, 10)));
  const byteLength = Buffer.byteLength(JSON.stringify(pack)); assert(byteLength <= MAX_TRACK_PACK_BYTES, `Pack exceeds importer limit: ${byteLength}`);
  return { pack, contentHash: validation.contentHash, byteLength, inputs, selected };
}
export function validateConceptMap(map: ConceptMap, editorialIds: string[], existingIds: Set<string>) {
  assert.equal(new Set(map.entries.map(entry => entry.editorialId)).size, map.entries.length, "Duplicate mapping");
  assert.deepEqual(new Set(map.entries.map(entry => entry.editorialId)), new Set(editorialIds), "Incomplete Concept map");
  assert.equal(new Set(map.entries.map(entry => entry.canonicalId)).size, map.entries.length, "Distinct editorial atomic targets must not collapse");
  for (const entry of map.entries) assert(entry.disposition === "existing" ? existingIds.has(entry.canonicalId) : !existingIds.has(entry.canonicalId), `Invalid Concept disposition ${entry.editorialId}`);
}
