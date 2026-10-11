import { expect, it } from "vitest";
import templates from "../../tools/estudisc-content-studio/teaching-complements/foundation-mathematics.json";
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

it("distinguishes minimum recurrence from maximum grouping for the same quantities", () => {
  const divisors = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter(d => n % d === 0);
  const commonDivisors = divisors(18).filter(d => 24 % d === 0);
  expect(Math.max(...commonDivisors)).toBe(6);
  const firstRecurrence = Array.from({ length: 144 }, (_, i) => i + 1).find(t => t % 18 === 0 && t % 24 === 0);
  expect(firstRecurrence).toBe(72);
  expect(18 / 6).toBe(3);
  expect(24 / 6).toBe(4);
});

it("verifies grouped powers and roots with all denominators/bases valid", () => {
  expect(Math.sqrt(16)).toBe(4);
  expect((3 ** 2 - Math.sqrt(16)) / 5).toBe(1);
  expect(2 ** -1).toBe(0.5);
  expect(((3 ** 2 - Math.sqrt(16)) / 5) ** 2 + 2 ** -1).toBe(3 / 2);
  expect(5).not.toBe(0);
  expect(2).not.toBe(0);
});

it("includes the equality boundary after dividing by a negative coefficient", () => {
  const original = (x: number) => -4 * x + 7 <= 23;
  expect(original(-4)).toBe(true);
  expect(original(0)).toBe(true);
  expect(original(-5)).toBe(false);
  for (let twiceX = -24; twiceX <= 24; twiceX++) expect(original(twiceX / 2)).toBe(twiceX / 2 >= -4);
});
