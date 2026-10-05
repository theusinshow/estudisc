import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TrackPackV2 } from "../../../src/features/import/application/track-pack-v2-schema";

import { SCIENCE_SOURCE_ROOT } from "../paths";
export const SOURCE_ROOT = SCIENCE_SOURCE_ROOT;
export const BASELINE_FILE = "tools/science-import/qa/source-baseline.json";
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(",")}}`;
  return JSON.stringify(value);
}
export function jsonFile(file: string) { return JSON.parse(readFileSync(file, "utf8")); }
export function verifySourceUnchanged() {
  const baseline = jsonFile(BASELINE_FILE) as { fileHashes: Record<string, string> };
  for (const [file, hash] of Object.entries(baseline.fileHashes)) assert.equal(sha(readFileSync(resolve(SOURCE_ROOT, file))), hash, `Source changed: ${file}`);
  return Object.keys(baseline.fileHashes).length;
}
export function auditEditorialSidecar(file: string, pack: TrackPackV2) {
  const sidecar = jsonFile(file);
  const lessons = pack.track.modules.flatMap(module => module.lessons);
  assert.equal(sidecar.sourcePacks.length, lessons.length);
  const integration = pack.track.metadata.scienceIntegration as { runtimeMediaLessonVersions?: Record<string, number> };
  if (integration.runtimeMediaLessonVersions && Object.keys(integration.runtimeMediaLessonVersions).length) assert.deepEqual(sidecar.runtimeMediaLessonVersions, integration.runtimeMediaLessonVersions, "Runtime media version map must remain explicit in the sidecar");
  for (const lesson of lessons) {
    const sourceFile = resolve(SOURCE_ROOT, `workspace/${lesson.id}/approved/pack.json`);
    const source = jsonFile(sourceFile);
    assert.deepEqual(sidecar.sourcePacks.find((candidate: { lesson: { lessonId: string } }) => candidate.lesson.lessonId === lesson.id), source, `${lesson.id}: source sidecar drift`);
    assert.equal(sidecar.sourcePins[lesson.id], sha(readFileSync(sourceFile)));
  }
}

// Independent comparisons against source and mapping sidecar, never adapter output.
export function auditAdaptedPack(pack: TrackPackV2) {
  const mapping = new Map<string, string>((jsonFile(".vecta-agent-context/CONCEPT-MAP.json").entries as { editorialId: string; canonicalId: string }[]).map(row => [row.editorialId, row.canonicalId]));
  const canonical = (id: string) => { const result = mapping.get(id); assert(result, `Missing Concept mapping ${id}`); return result; };
  const lessons = pack.track.modules.flatMap(module => module.lessons);
  const integration = pack.track.metadata.scienceIntegration as { status: string; sourceLessonVersion: number; runtimeMediaLessonVersions?: Record<string, number>; humanApprovalRecorded: boolean; sourceHashes: Record<string, string> };
  assert.equal(integration.status, "draft");
  assert.equal(integration.humanApprovalRecorded, false);
  assert.equal(integration.sourceLessonVersion, 2);
  assert.equal(pack.conceptPrerequisites.length, 0, "No source prerequisites may be invented");
  assert.equal(pack.questions.length, lessons.length * 8);
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
  for (const lesson of lessons) {
    const file = resolve(SOURCE_ROOT, `workspace/${lesson.id}/approved/pack.json`);
    const raw = readFileSync(file);
    const source = JSON.parse(raw.toString("utf8"));
    assert.equal(integration.sourceHashes[lesson.id], sha(raw), `${lesson.id}: source hash`);
    assert.equal(lesson.title, source.lesson.title);
    assert.equal(lesson.status, "draft");
    const hasFigure = lesson.blocks.some(block => block.type === "figure");
    assert.equal(lesson.version, hasFigure ? 3 : 2, `${lesson.id}: immutable runtime lesson version`);
    if (hasFigure) assert.equal(integration.runtimeMediaLessonVersions?.[lesson.id], 3);
    assert.deepEqual(lesson.prerequisiteConceptIds, []);
    assert.deepEqual(lesson.concepts.map(concept => ({ id: concept.id, title: concept.title, summary: concept.summary })), source.lesson.concepts.map((concept: { id: string; name: string; masteryTarget: string }) => ({ id: canonical(concept.id), title: concept.name, summary: concept.masteryTarget })));
    assert.equal(lesson.blocks.length, source.lesson.blocks.length);
    for (const sourceBlock of source.lesson.blocks) {
      const block = lesson.blocks.find(candidate => candidate.id === sourceBlock.id);
      assert(block, `Missing block ${sourceBlock.id}`);
      assert.deepEqual(block.payload.editorial, { id: sourceBlock.id, type: sourceBlock.type, sourceHash: sha(stableJson(sourceBlock)) }, `${sourceBlock.id}: editorial identity/hash drift`);
      const text = [sourceBlock.content, ...(sourceBlock.items ?? []), sourceBlock.prompt, sourceBlock.answer, sourceBlock.reasoning, ...(sourceBlock.answerGuide?.mustMention ?? [])].filter((value): value is string => typeof value === "string");
      if (block.type === "figure") {
        assert(["IMAGE_REQUEST", "DETERMINISTIC_COMPONENT_REQUEST"].includes(sourceBlock.type), "Only media requests become figures");
        assert(typeof block.payload.alt === "string" && typeof block.payload.longDescription === "string", `${block.id}: figure accessibility`);
      } else {
        assert.equal(block.payload.title, sourceBlock.title);
        assert(typeof block.payload.content === "string", `${block.id}: missing rendered content`);
        for (const paragraph of text) {
          assert(block.payload.content.includes(paragraph), `${block.id}: missing educational text`);
        }
      }
    }
    for (const original of source.questions) {
      const question = pack.questions.find(candidate => candidate.id === original.id);
      assert(question, `Missing Question ${original.id}`);
      assert.equal(question.stem, original.stem);
      assert.equal(question.explanation, original.explanation);
      assert.equal(question.difficulty, original.difficulty.toLowerCase());
      const operation = { UNDERSTAND: "interpret", ANALYZE: "analyze", APPLY: "apply", TRANSFER: "apply", EVALUATE: "evaluate" }[original.cognitiveOperation as "UNDERSTAND" | "ANALYZE" | "APPLY" | "TRANSFER" | "EVALUATE"];
      assert.deepEqual(question.cognitiveOperations, [operation]);
      assert.equal(question.type, "multiple_choice");
      assert.equal(question.version, 2);
      assert.equal(question.status, "draft");
      assert.deepEqual(question.choices?.map(choice => ({ key: choice.id, text: choice.content })), original.options);
      assert.deepEqual(question.choices?.filter(choice => choice.correct).map(choice => choice.id), [original.correctOption]);
      assert.deepEqual(question.answer, { kind: "multiple_choice", choiceId: original.correctOption });
      assert.deepEqual(question.conceptIds, original.conceptIds.map(canonical));
      assert.equal(question.primaryConceptId, canonical(original.conceptIds[0]));
      assert.deepEqual(question.provenance, { type: "generated", generationRunId: "vecta.science.editorial-v2" });
      assert.equal(original.provenance, "ORIGINAL_VECTA_GROUNDED_V2");
      const activity = lesson.activities.find(candidate => candidate.questionId === question.id);
      assert(activity, `Missing activity ${question.id}`);
      assert([original.stem, `Questão ${original.id}`, original.id].includes(activity.prompt), `${original.id}: activity label must reference the unchanged canonical Question`);
      assert.deepEqual(activity.conceptIds, question.conceptIds);
    }
  }
  return { lessons: lessons.length, questions: pack.questions.length, blocks: lessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0), sourceFilesUnchanged: verifySourceUnchanged() };
}
