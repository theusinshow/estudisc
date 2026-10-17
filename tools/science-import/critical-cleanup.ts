import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { MAX_TRACK_PACK_BYTES } from "../../src/features/import/application/import-request";
import { trackPackV2Schema } from "../../src/features/import/application/track-pack-v2-schema";
import { validateTrackPack } from "../../src/features/import/application/track-pack-validation";
import { mediaAssetsSchema } from "./contracts";
import { SCIENCE_DRAFT_PACK, SCIENCE_MEDIA_ASSETS, SCIENCE_SOURCE_ROOT } from "./paths";
import { buildSciencePack, readJson } from "./mapper";

type SourceBlock = {
  id: string; type: string; title: string; content?: string; items?: string[];
  prompt?: string; answer?: string; reasoning?: string;
  answerGuide?: { mustMention: string[] }; request?: string; requestRef?: string; status?: string; variant?: string;
};
type SourcePack = { lesson: { lessonId: string; blocks: SourceBlock[] } };
type RuntimeBlock = {
  id: string; type: string;
  payload: Record<string, unknown>;
};
type RuntimeLesson = { id: string; version: number; blocks: RuntimeBlock[] };
type RuntimePack = {
  version: number;
  track: { metadata: Record<string, unknown>; modules: { lessons: RuntimeLesson[] }[] };
};
type RuntimeQuestion = { id: string; version: number; choices: { id: string; content: string; correct: boolean; targetsError?: string; rationale?: string }[] };
type AuthoredQuestion = { id: string; options: { key: string; text: string; targetsError?: string; rationale?: string }[] };
type MediaRequest = { id: string; lessonId: string; description: string; status?: string };
type MediaQueue = { requests: MediaRequest[] };

const SNAPSHOT_VERSION = 8;
const LESSON_VERSION = 3;
const MEDIA_LESSON_VERSION = 4;
/** Questions whose authored distractor rationales reach the runtime (2026-10-16). */
const RATIONALE_QUESTION_VERSION = 3;
const OLD_CREDIT = "VECTA Science V2 - representação determinística local; revisão humana pendente.";
const OLD_REVIEW_NOTICE = "Versão estática em rascunho; revisão humana pendente.";

function sourceText(block: SourceBlock): string[] {
  return [block.content, ...(block.items ?? []), block.prompt, block.answer, block.reasoning, ...(block.answerGuide?.mustMention ?? [])]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}
function isMediaRequest(block: SourceBlock): boolean {
  return block.type === "IMAGE_REQUEST" || block.type === "DETERMINISTIC_COMPONENT_REQUEST";
}
function payloadRecord(block: RuntimeBlock): Record<string, unknown> {
  return block.payload;
}

export function buildCriticalSciencePack(root = process.cwd()) {
  const lessonIds = Array.from({ length: 40 }, (_, index) => "CIE-" + String(index + 1).padStart(2, "0"));
  const media = mediaAssetsSchema.parse(readJson(resolve(root, SCIENCE_MEDIA_ASSETS)));
  const generated = buildSciencePack(root, lessonIds, SNAPSHOT_VERSION, undefined, { assets: [] });
  const pack = structuredClone(generated.pack) as unknown as RuntimePack;
  const lessons = pack.track.modules.flatMap(module => module.lessons);
  const lessonsById = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const sources = new Map<string, SourcePack>(generated.selected.map(row => [row.lessonId, row.pack as unknown as SourcePack]));
  for (const source of sources.values()) {
    const misconceptions = source.lesson.blocks.find(block => block.variant === "MISCONCEPTIONS");
    assert.equal(misconceptions?.items?.length, 8, source.lesson.lessonId + ": expected four marked myth/correction pairs");
    assert(misconceptions?.items?.every((item, index) => item.startsWith(index % 2 ? "\u2705 " : "\u274C ")), source.lesson.lessonId + ": every myth and correction must be marked");
  }
  const mediaRequests = (readJson(resolve(root, SCIENCE_SOURCE_ROOT, "MEDIA-PRODUCTION/DETERMINISTIC-ASSET-QUEUE.json")) as MediaQueue).requests;
  const requestsById = new Map(mediaRequests.map(request => [request.id, request]));

  assert.equal(lessons.length, 40);
  assert.equal(pack.version, SNAPSHOT_VERSION);
  const omittedPlaceholderBlocks: Array<Record<string, unknown>> = [];

  for (const asset of media.assets) {
    const lessonId = /^COMP-(CIE-\d{2})-/.exec(asset.requestId)?.[1];
    assert(lessonId, "Unexpected Science component asset " + asset.requestId);
    const lesson = lessonsById.get(lessonId);
    const sourcePack = sources.get(lessonId);
    assert(lesson && sourcePack, "Missing Science lesson source " + lessonId);
    const figurePack = buildSciencePack(root, [lessonId], SNAPSHOT_VERSION, undefined, { assets: [asset] });
    const figureLesson = figurePack.pack.track.modules.flatMap(module => module.lessons).find(candidate => candidate.id === lessonId);
    const figure = figureLesson?.blocks.find(block => block.type === "figure") as RuntimeBlock | undefined;
    assert(figure, "Media request did not produce a figure " + asset.requestId);
    const sourceBlock = sourcePack.lesson.blocks.find(block => block.id === figure.id);
    assert(sourceBlock && isMediaRequest(sourceBlock), "Figure has no source request " + figure.id);
    const request = requestsById.get(asset.requestId);
    assert(request, "Missing deterministic media brief " + asset.requestId);
    const payload = payloadRecord(figure);
    const editorial = payload.editorial as Record<string, unknown>;
    editorial.omittedBriefing = {
      sourceRequest: sourceBlock.request ?? request.description,
      originalCaption: request.description + " " + OLD_REVIEW_NOTICE,
      originalCredit: OLD_CREDIT,
      assetStatus: asset.status,
      factualReviewStatus: "PENDING",
      visualReviewStatus: "PENDING"
    };
    const index = lesson.blocks.findIndex(block => block.id === figure.id);
    assert(index >= 0, "Missing figure replacement target " + figure.id);
    lesson.blocks[index] = figure;
    lesson.version = MEDIA_LESSON_VERSION;
  }

  for (const lesson of lessons) {
    const sourcePack = sources.get(lesson.id);
    assert(sourcePack, "Missing source pack " + lesson.id);
    const sourceBlocks = new Map(sourcePack.lesson.blocks.map(block => [block.id, block]));
    lesson.blocks = lesson.blocks.filter(block => {
      const sourceBlock = sourceBlocks.get(block.id);
      assert(sourceBlock, "Runtime block has no source " + lesson.id + "/" + block.id);
      const mediaBacked = block.type === "figure";
      if (isMediaRequest(sourceBlock) && !mediaBacked && sourceText(sourceBlock).length === 0) {
        omittedPlaceholderBlocks.push({
          lessonId: lesson.id, id: sourceBlock.id, type: sourceBlock.type,
          requestRef: sourceBlock.requestRef ?? null, request: sourceBlock.request ?? null
        });
        return false;
      }
      return true;
    });
    if (lesson.version !== MEDIA_LESSON_VERSION) lesson.version = LESSON_VERSION;
  }

  // The approved option contract is {key, text}; distractor rationales live in author/questions.json.
  // Carry them to the runtime choices (the error has to teach) as a new immutable Question version.
  const authoredRationales: string[] = [];
  for (const question of (pack as unknown as { questions: RuntimeQuestion[] }).questions) {
    const authoredPath = resolve(root, SCIENCE_SOURCE_ROOT, "workspace", question.id.slice(0, 6), "author/questions.json");
    if (!existsSync(authoredPath)) continue;
    const authored = (readJson(authoredPath) as AuthoredQuestion[]).find(candidate => candidate.id === question.id);
    if (!authored?.options.some(candidate => candidate.rationale)) continue;
    for (const choice of question.choices) {
      const option: AuthoredQuestion["options"][number] | undefined = authored.options.find(candidate => candidate.key === choice.id);
      assert(option && option.text === choice.content, "Authored option differs from approved source " + question.id + "/" + choice.id);
      if (choice.correct) { assert.equal(option.rationale, undefined, "Correct choice cannot carry a distractor rationale: " + question.id); continue; }
      if (option.targetsError) choice.targetsError = option.targetsError;
      if (option.rationale) choice.rationale = option.rationale;
    }
    question.version = RATIONALE_QUESTION_VERSION;
    authoredRationales.push(question.id);
  }

  const integration = pack.track.metadata.scienceIntegration as Record<string, unknown>;
  integration.rationaleQuestionVersions = Object.fromEntries(authoredRationales.map(id => [id, RATIONALE_QUESTION_VERSION]));
  integration.runtimeMediaLessonVersions = Object.fromEntries(lessons.filter(lesson => lesson.version === MEDIA_LESSON_VERSION).map(lesson => [lesson.id, MEDIA_LESSON_VERSION]));
  assert.equal(Object.keys(integration.runtimeMediaLessonVersions as Record<string, number>).length, media.assets.length);

  const parsed = trackPackV2Schema.parse(pack);
  const validation = validateTrackPack(parsed);
  assert(validation.ok, validation.ok ? "" : JSON.stringify(validation.issues.slice(0, 8)));
  const byteLength = Buffer.byteLength(JSON.stringify(parsed));
  assert.equal(validation.contentHash, hashCanonicalJson(parsed), "Canonical snapshot hash mismatch");
  assert(byteLength <= MAX_TRACK_PACK_BYTES, "Science snapshot exceeds importer limit: " + byteLength);
  const blockedText = /\b(rascunho|pendentes?|revisão humana)\b|IMG-[A-Z]+-\d+/i;
  for (const lesson of parsed.track.modules.flatMap(module => module.lessons)) for (const block of lesson.blocks) {
    const payload = block.payload as Record<string, unknown>;
    for (const field of ["title", "content", "caption", "credit", "alt", "longDescription"]) {
      assert(!blockedText.test(typeof payload[field] === "string" ? payload[field] as string : ""), "Internal text remains visible in " + lesson.id + "/" + block.id + "/" + field);
    }
  }

  const sidecar = {
    snapshotVersion: SNAPSHOT_VERSION,
    sourcePins: Object.fromEntries(generated.selected.map(row => [row.lessonId, row.sourceHash])),
    sourcePacks: generated.selected.map(row => row.pack),
    sourceLibrary: generated.inputs.library,
    conceptMap: generated.inputs.conceptMap.entries.filter(entry => lessonIds.some(id => entry.editorialId.startsWith(id + "-"))),
    media,
    runtimeMediaLessonVersions: integration.runtimeMediaLessonVersions,
    omittedPlaceholderBlocks,
    integrationDefaults: {
      estimatedMinutes: 30, originalProvenance: "ORIGINAL_VECTA_GROUNDED_V2",
      provenanceType: "generated", cognitiveOperations: { UNDERSTAND: "interpret", TRANSFER: "apply" },
      curriculumCrosswalkUnverified: true
    }
  };
  return { pack: parsed, sidecar, media, byteLength, contentHash: validation.contentHash, omittedPlaceholderBlocks };
}

function writeCandidate(root = process.cwd()) {
  const result = buildCriticalSciencePack(root);
  const packPath = resolve(root, SCIENCE_DRAFT_PACK);
  const sidecarPath = resolve(dirname(packPath), "editorial-sidecar.json");
  const mediaPath = resolve(root, SCIENCE_MEDIA_ASSETS);
  assert(packPath.startsWith(resolve(root)), "Pack output escaped the repository");
  mkdirSync(dirname(packPath), { recursive: true });
  writeFileSync(packPath, JSON.stringify(result.pack) + "\n", "utf8");
  writeFileSync(sidecarPath, JSON.stringify(result.sidecar, null, 2) + "\n", "utf8");
  writeFileSync(mediaPath, JSON.stringify(result.media, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({
    pack: SCIENCE_DRAFT_PACK, version: result.pack.version, lessons: 40,
    questions: result.pack.questions.length, blocks: result.pack.track.modules[0].lessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0),
    omittedPlaceholderBlocks: result.omittedPlaceholderBlocks.length, bytes: result.byteLength,
    contentHash: result.contentHash, output: packPath
  }, null, 2));
}

if (process.argv[1] && /critical-cleanup\.(ts|js)$/.test(process.argv[1])) writeCandidate();
