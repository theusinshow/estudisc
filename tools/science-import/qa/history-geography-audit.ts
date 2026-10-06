import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TrackPackV2 } from "../../../src/features/import/application/track-pack-v2-schema";
import { validateTrackPack } from "../../../src/features/import/application/track-pack-validation";
import { hashCanonicalJson } from "../../../src/lib/canonical-json";
import { GH_SOURCE, ghPackSchema } from "../history-geography";
import { readJson, sha256 } from "../mapper";

function strings(value: unknown, key = ""): string[] {
  if (typeof value === "string") return ["title", "content", "items", "prompt", "answer", "reasoning", "answerGuide", "mustMention"].includes(key) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(item => strings(item, key));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([field, nested]) => strings(nested, field));
  return [];
}
export function auditGhPack(pack: TrackPackV2) {
  assert(validateTrackPack(pack).ok, "Invalid adapted Pack");
  const pins = readJson(".estudisc-agent-context/history-geography/SOURCE-PIN.json") as { files: Record<string, string> };
  for (const [file, hash] of Object.entries(pins.files)) assert.equal(sha256(readFileSync(resolve(GH_SOURCE, file))), hash, `Source changed ${file}`);
  const lessons = pack.track.modules.flatMap(module => module.lessons);
  const questionIds = new Set<string>();
  let concepts = 0, blocks = 0, pendingMedia = 0;
  for (const lesson of lessons) {
    const original = ghPackSchema.parse(readJson(`${GH_SOURCE}/workspace/${lesson.id}/approved/pack.json`));
    assert.equal(lesson.title, original.lesson.title);
    assert.equal(lesson.version, 2); assert.equal(lesson.status, "draft");
    assert.equal(lesson.concepts.length, original.lesson.concepts.length);
    original.lesson.concepts.forEach((source, index) => { assert.equal(lesson.concepts[index].title, source.name); assert.equal(lesson.concepts[index].summary, source.masteryTarget); });
    assert.equal(lesson.blocks.length, original.lesson.blocks.length);
    lesson.blocks.forEach((block, index) => {
      const source = original.lesson.blocks[index];
      assert.equal((block.payload.editorial as { sourceHash: string }).sourceHash, hashCanonicalJson(source));
      assert.equal((block.payload.editorial as { type: string }).type, source.type);
      for (const text of strings(source)) assert(`${block.payload.title}\n${block.payload.content}`.includes(text), `${block.id}: missing educational text`);
      if (["IMAGE_REQUEST", "COMPONENT_REQUEST"].includes(source.type)) pendingMedia++;
      blocks++;
    });
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
  }
  assert.equal(pack.questions.length, questionIds.size);
  assert(!/[\uFFFD]|Ã[¡-¿]|Â[\u0080-\u00bf]/u.test(JSON.stringify(pack)), "Unicode corruption");
  return { lessons: lessons.length, questions: questionIds.size, concepts, blocks, pendingMedia, sourceFilesUnchanged: Object.keys(pins.files).length, answersUnchanged: true, draftsOnly: true };
}
