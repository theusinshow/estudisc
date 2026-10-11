import { expect, it } from "vitest";
import templates from "../../tools/estudisc-content-studio/teaching-complements/operations-factorization.json";
import { loadBlueprintCorpus } from "../../tools/estudisc-content-studio/blueprint-sources";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { resolveLessonVersionContext } from "@/features/import/application/lesson-version-policy";

it.each(templates.templates)("retains every original field and Question for $lessonId", template => {
  const { pack } = loadBlueprintCorpus(process.cwd()).find(c => c.pack.track.modules.some(m => m.lessons.some(l => l.id === template.lessonId)))!;
  const moduleRecord = pack.track.modules.find(m => m.lessons.some(l => l.id === template.lessonId))!;
  const source = moduleRecord.lessons.find(l => l.id === template.lessonId)!;
  expect(source.version).toBe(template.baseVersion);
  expect(source.objectives).toContain(template.objective);
  const anchor = source.blocks.find(b => b.id === template.anchorId)!;
  expect(anchor.conceptIds).toContain(template.conceptId);
  const refs = [...new Set([...source.exitTicketQuestionIds, ...source.activities.flatMap(a => a.questionId ? [a.questionId] : [])])];
  const before = hashCanonicalJson(pack);
  const addition = { id: template.newBlockId, schemaVersion: 1, type: "worked-example", conceptIds: [template.conceptId], payload: { type: "worked-example", title: template.title, content: template.content } };
  const lesson = { ...structuredClone(source), status: "draft", version: source.version + 1, blocks: source.blocks.flatMap(b => b.id === anchor.id ? [structuredClone(b), addition] : [structuredClone(b)]) };
  const packet = lessonVersionPackSchema.parse({ schema: "caderno.lesson.v2", packId: `fixture.teaching.${source.id.toLowerCase()}`, version: 1, authorId: "fixture-author", target: { trackId: pack.track.id, trackVersion: pack.version, moduleId: moduleRecord.id, lessonId: source.id, baseVersion: source.version, baseHash: hashCanonicalJson(source) }, lesson, questionReferences: refs.map(id => { const q = pack.questions.find(q => q.id === id)!; return { id, version: q.version, hash: hashCanonicalJson(q) }; }) });
  expect(() => resolveLessonVersionContext([pack], packet)).not.toThrow();
  expect({ ...packet.lesson, status: source.status, version: source.version, blocks: packet.lesson.blocks.filter(b => b.id !== addition.id) }).toEqual(source);
  expect(hashCanonicalJson(pack)).toBe(before);
  expect(packet.lesson.blocks.findIndex(b => b.id === addition.id)).toBe(packet.lesson.blocks.findIndex(b => b.id === anchor.id) + 1);
  const modified = structuredClone(packet);
  modified.questionReferences[0].hash = "0".repeat(64);
  expect(() => resolveLessonVersionContext([pack], modified)).toThrow("Question reference/hash changed");
});

it("keeps division and multiplication left associative", () => {
  expect(48 / 6 * 2 - 3 * (4 - 1)).toBe(7);
  expect(48 / 6 * 2).toBe(16);
  expect(48 / (6 * 2)).toBe(4);
});
it("preserves the factorization identity, including its zero factor", () => {
  expect(Array.from({length: 10}, (_, i) => i + 1).filter(n => 10 % n === 0 && 15 % n === 0).at(-1)).toBe(5);
  for (let twiceT = -20; twiceT <= 20; twiceT++) {
    const t = twiceT / 2;
    expect(10 * t ** 3 - 15 * t ** 2 === 5 * t ** 2 * (2 * t - 3)).toBe(true);
  }
  expect(5 * 0 ** 2 * (2 * 0 - 3) === 0).toBe(true);
});
