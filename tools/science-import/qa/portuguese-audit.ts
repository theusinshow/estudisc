import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TrackPackV2 } from "../../../src/features/import/application/track-pack-v2-schema";
import { validateTrackPack } from "../../../src/features/import/application/track-pack-validation";
import { hashCanonicalJson } from "../../../src/lib/canonical-json";
import { PORTUGUESE_SOURCE, portuguesePackSchema } from "../portuguese";
import { readJson, sha256 } from "../mapper";

const normalizeSearch = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
function educationalStrings(value: unknown, key = ""): string[] {
  if (typeof value === "string") return ["content", "title", "paragraphs", "items", "term", "claim", "instruction", "stimulus", "analysis", "prompt", "steps", "evidence"].includes(key) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(item => educationalStrings(item, key));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([nestedKey, nested]) => educationalStrings(nested, nestedKey));
  return [];
}
export function auditPortuguesePack(pack: TrackPackV2) {
  assert(validateTrackPack(pack).ok, "Invalid runtime pack");
  const pins = readJson(".estudisc-agent-context/portuguese/SOURCE-PIN.json") as { files: Record<string, string> };
  for (const [file, hash] of Object.entries(pins.files)) assert.equal(sha256(readFileSync(resolve(PORTUGUESE_SOURCE, file))), hash, `Source changed ${file}`);
  const ids = new Set<string>();
  const lessons = pack.track.modules.flatMap(module => module.lessons);
  let blocks = 0;
  for (const lesson of lessons) {
    const source = portuguesePackSchema.parse(readJson(`${PORTUGUESE_SOURCE}/workspace/${lesson.id}/approved/pack.json`));
    assert.equal(lesson.title, source.lesson.title);
    assert.equal(lesson.estimatedMinutes, source.lesson.estimatedMinutes);
    assert.equal(lesson.status, "draft");
    assert.equal(lesson.blocks.length, source.lesson.blocks.length);
    assert.equal(lesson.activities.length, source.questions.length);
    lesson.blocks.forEach((block, index) => {
      const original = source.lesson.blocks[index];
      assert.equal((block.payload.editorial as { sourceHash: string }).sourceHash, hashCanonicalJson(original));
      for (const text of educationalStrings(original)) assert(`${block.payload.title}\n${block.payload.content}`.includes(text), `${block.id}: missing educational text`);
      blocks++;
    });
    for (const original of source.questions) {
      assert(!ids.has(original.id), `Duplicate Question ${original.id}`); ids.add(original.id);
      const question = pack.questions.find(row => row.id === original.id); assert(question);
      assert.equal(question.stem, original.stimulus ? `${original.stimulus}\n\n${original.stem}` : original.stem);
      assert.deepEqual(question.choices?.map(choice => ({ id: choice.id, text: choice.content })), original.options);
      assert.deepEqual(question.answer, { kind: "multiple_choice", choiceId: original.correctOption });
      assert.equal(question.explanation, original.explanation);
      assert.equal(question.choices?.filter(choice => choice.correct).length, 1);
      assert.equal(question.status, "draft");
      assert.equal(question.provenance.type, "generated");
    }
  }
  assert.equal(pack.questions.length, ids.size, "Extra/unlinked Questions");
  const text = JSON.stringify(pack);
  assert(!/[\uFFFD]|Ã[¡-¿]|Â[\u0080-\u00bf]/u.test(text), "Possible Unicode corruption");
  assert.equal(normalizeSearch("AÇÃO, crase À escola e GÊNEROS"), "acao, crase a escola e generos");
  assert.equal(normalizeSearch("Português"), normalizeSearch("portugues"));
  return { lessons: lessons.length, questions: ids.size, concepts: lessons.reduce((count, lesson) => count + lesson.concepts.length, 0), blocks, sourceFilesUnchanged: Object.keys(pins.files).length, answersUnchanged: true, stimulusPreserved: true, unicodeValid: true, normalizationProbe: true, publicationPerformed: false };
}
