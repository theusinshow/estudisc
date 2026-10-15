import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TrackPackV2 } from "../../../src/features/import/application/track-pack-v2-schema";
import { validateTrackPack } from "../../../src/features/import/application/track-pack-validation";
import { hashCanonicalJson } from "../../../src/lib/canonical-json";
import { HISTORY_GEOGRAPHY_MISCONCEPTION_CORRECTIONS } from "../../gh-import/history-geography-corrections";
import { GH_SOURCE, ghPackSchema } from "../history-geography";
import { readJson, sha256 } from "../mapper";

function strings(value: unknown, key = ""): string[] {
  if (typeof value === "string") return ["title", "content", "items", "prompt", "answer", "reasoning", "answerGuide", "mustMention"].includes(key) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(item => strings(item, key));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([field, nested]) => strings(nested, field));
  return [];
}
function editorialMetadata(block: TrackPackV2["track"]["modules"][number]["lessons"][number]["blocks"][number]) {
  const editorial = block.payload.editorial as Record<string, unknown> | undefined;
  return editorial?.metadata as { omittedSourceBlocks?: Record<string, unknown>[] } | undefined;
}
export function auditGhPack(pack: TrackPackV2) {
  assert(validateTrackPack(pack).ok, "Invalid adapted Pack");
  const pins = readJson(".estudisc-agent-context/history-geography/SOURCE-PIN.json") as { files: Record<string, string> };
  for (const [file, hash] of Object.entries(pins.files)) assert.equal(sha256(readFileSync(resolve(GH_SOURCE, file))), hash, `Source changed ${file}`);
  const lessons = pack.track.modules.flatMap(module => module.lessons);
  const questionIds = new Set<string>();
  let concepts = 0, blocks = 0, emittedBlocks = 0, pendingMedia = 0;
  for (const lesson of lessons) {
    const original = ghPackSchema.parse(readJson(`${GH_SOURCE}/workspace/${lesson.id}/approved/pack.json`));
    assert.equal(lesson.title, original.lesson.title);
    assert.equal(lesson.version, 2); assert.equal(lesson.status, "draft");
    assert.equal(lesson.concepts.length, original.lesson.concepts.length);
    original.lesson.concepts.forEach((source, index) => { assert.equal(lesson.concepts[index].title, source.name); assert.equal(lesson.concepts[index].summary, source.masteryTarget); });
    const sourceRequests = original.lesson.blocks.filter(source => ["IMAGE_REQUEST", "COMPONENT_REQUEST"].includes(source.type));
    const sourceBlocks = original.lesson.blocks.filter(source => !["IMAGE_REQUEST", "COMPONENT_REQUEST"].includes(source.type));
    assert.equal(lesson.blocks.length, sourceBlocks.length);
    const blocksById = new Map(lesson.blocks.map(block => [block.id, block]));
    assert.equal(blocksById.size, lesson.blocks.length);
    const omittedMetadata = lesson.blocks.flatMap(block => editorialMetadata(block)?.omittedSourceBlocks ?? []);
    assert.equal(omittedMetadata.length, sourceRequests.length);
    for (const source of sourceRequests) {
      const metadata = omittedMetadata.find(record => record.id === source.id);
      assert(metadata, `${source.id}: missing suppressed-block metadata`);
      assert.equal(metadata.sourceType, source.type);
      assert.equal(metadata.sourceTitle, source.title);
      assert.equal(metadata.requestRef, source.requestRef);
      assert.equal(metadata.status, source.status);
      assert.equal(metadata.sourceHash, hashCanonicalJson(source));
      assert.equal(metadata.removedVisibleText, source.type === "IMAGE_REQUEST" ? `Ilustração pendente: ${source.requestRef}.` : "Componente determinístico pendente de implementação e validação.");
      const request = metadata.request as Record<string, unknown>;
      assert.equal(request.id, source.requestRef);
      assert.equal(request.lessonId, lesson.id);
      pendingMedia++;
    }
    for (const source of sourceBlocks) {
      const block = blocksById.get(source.id);
      assert(block, `${source.id}: missing projected block`);
      assert.equal((block.payload.editorial as { sourceHash: string }).sourceHash, hashCanonicalJson(source));
      assert.equal((block.payload.editorial as { type: string }).type, source.type);
      const visible = `${String(block.payload.title ?? "")}\n${String(block.payload.content ?? "")}`;
      for (const text of strings(source)) assert(visible.includes(text), `${block.id}: missing educational text`);
      if (source.title === "Erros que custam ponto") {
        const corrections = HISTORY_GEOGRAPHY_MISCONCEPTION_CORRECTIONS[lesson.id];
        assert(source.items && corrections && source.items.length === corrections.length);
        source.items.forEach((claim, index) => assert(visible.includes(`? ${claim} ? ${corrections[index]}`), `${block.id}: missing factual correction ${index + 1}`));
      }
    }
    const visibleText = lesson.blocks.map(block => `${String(block.payload.title ?? "")}\n${String(block.payload.content ?? "")}`).join("\n");
    assert(!/Ilustração pendente: IMG-GH-|Componente determinístico pendente de implementação e validação|briefing/i.test(visibleText), `${lesson.id}: internal media text remains visible`);
    assert.equal(lesson.activities.length, 8);
    for (const source of original.questions) {
      assert(!questionIds.has(source.id)); questionIds.add(source.id);
      const question = pack.questions.find(row => row.id === source.id); assert(question);
      assert.equal(question.stem, source.stem); assert.equal(question.explanation, source.explanation);
      assert.deepEqual(question.choices?.map(choice => ({ key: choice.id, text: choice.content })), source.options);
      assert.deepEqual(question.answer, { kind: "multiple_choice", choiceId: source.correctOption });
      assert.equal(question.choices?.filter(choice => choice.correct).length, 1);
      assert.equal(question.version, 2); assert.equal(question.status, "draft");
      assert.equal(question.provenance.type, "generated");
    }
    concepts += lesson.concepts.length;
    blocks += original.lesson.blocks.length;
    emittedBlocks += lesson.blocks.length;
  }
  assert.equal(pack.questions.length, questionIds.size);
  assert(!/[\uFFFD]|�[�-�]|�[\u0080-\u00bf]/u.test(JSON.stringify(pack)), "Unicode corruption");
  return { lessons: lessons.length, questions: questionIds.size, concepts, blocks, emittedBlocks, pendingMedia, sourceFilesUnchanged: Object.keys(pins.files).length, answersUnchanged: true, draftsOnly: true };
}
