import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonBlockList } from "@/features/lessons/blocks";
import { QuestionPanel } from "@/features/activities/components/question-panel";
import { studentQuestion } from "@/features/questions/student-view";
import { canExposeQuestion, evaluateQuestion } from "@/features/questions/api";
import { PORTUGUESE_BATCHES, PORTUGUESE_PILOT, buildPortuguesePack, portuguesePackSchema } from "../tools/science-import/portuguese";
import { validateConceptMap } from "../tools/science-import/mapper";
import { auditPortuguesePack } from "../tools/science-import/qa/portuguese-audit";

describe("Portuguese editorial integration", () => {
  const ids = [...new Set([...PORTUGUESE_PILOT, ...PORTUGUESE_BATCHES.flat()])].sort();
  it("preserves all24source lessons/192keys/144targets and deduplicates cumulative pilot batches", () => {
    const result = buildPortuguesePack(process.cwd(), ids, 6);
    expect(auditPortuguesePack(result.pack)).toMatchObject({ lessons: 24, questions: 192, concepts: 144, blocks: 264, sourceFilesUnchanged: 164 });
    const existing = JSON.parse(readFileSync(".estudisc-agent-context/EXISTING-CONCEPTS.json", "utf8")) as { id: string }[];
    expect(() => validateConceptMap(result.inputs.conceptMap, result.concepts.map(row => row.editorialConceptId), new Set(existing.map(row => row.id)))).not.toThrow();
    expect(result.pack.track.modules[0].lessons.every(lesson => lesson.version === 2)).toBe(true);
    expect(result.pack.questions.every(question => question.version === 1)).toBe(true);
    expect(result.pack.track.metadata.portugueseIntegration).toMatchObject({ sourceLessonVersion: 1, humanApprovalRecorded: false, officialMappingVerified: false, estimatedMinutesIsIntegrationDefault: false });
    expect(result.pack.curriculumRequirements).toEqual([]);
    expect(result.pack.conceptPrerequisites).toEqual([]);
    expect(result.byteLength).toBeLessThan(1048576);
    const sizes = PORTUGUESE_BATCHES.map((_, index) => new Set([...PORTUGUESE_PILOT, ...PORTUGUESE_BATCHES.slice(0, index + 1).flat()]).size);
    expect(sizes).toEqual([13, 17, 20, 24]);
    expect(() => portuguesePackSchema.parse({ ...result.originals[0].original, ignored: true })).toThrow();
    const invalid = structuredClone(result.originals[0].original); invalid.questions[0].options[1].id = invalid.questions[0].options[0].id;
    // The load validator also rejects repeated A–E IDs; schema refuses unsupported answer keys.
    expect(() => portuguesePackSchema.parse({ ...invalid, questions: [{ ...invalid.questions[0], correctOption: "F" }, ...invalid.questions.slice(1)] })).toThrow();
  });
  it("detects lost teaching text or silently modified answers, despite intact sidecars", () => {
    const { pack } = buildPortuguesePack(process.cwd(), PORTUGUESE_PILOT, 2);
    const changed = structuredClone(pack); changed.track.modules[0].lessons[0].blocks[0].payload.content = "removed";
    expect(() => auditPortuguesePack(changed)).toThrow("missing educational text");
    const wrong = structuredClone(pack); wrong.questions[0].explanation = "changed";
    expect(() => auditPortuguesePack(wrong)).toThrow();
  });
  it("renders the eight pilots through the shared core, preserving Unicode and all five answer evaluations", () => {
    const { pack } = buildPortuguesePack(process.cwd(), PORTUGUESE_PILOT, 2);
    for (const lesson of pack.track.modules[0].lessons) {
      const markup = renderToStaticMarkup(<LessonBlockList blocks={lesson.blocks.map(block => ({ stableId: block.id, type: block.type, payload: block.payload }))}/>);
      const document = new DOMParser().parseFromString(markup, "text/html");
      expect(document.body.textContent).not.toMatch(/Bloco inválido|Conteúdo inválido|renderer aprovado/);
      for (const block of lesson.blocks) for (const paragraph of String(block.payload.content).split(/\n\s*\n/)) expect(document.body.textContent).toContain(paragraph);
    }
    for (const question of pack.questions) {
      const student = studentQuestion(question);
      const markup = renderToStaticMarkup(<QuestionPanel question={student} activityStableId={`${question.id}-ACT`}/>);
      const document = new DOMParser().parseFromString(markup, "text/html");
      for (const line of question.stem.split(/\n\s*\n/)) expect(document.body.textContent).toContain(line);
      for (const choice of question.choices ?? []) {
        expect(document.body.textContent).toContain(choice.content);
        expect(evaluateQuestion(question, choice.id)).toMatchObject({ correct: choice.correct, evidenceEligible: true });
      }
      for (const context of ["training", "review", "assessment"] as const) expect(canExposeQuestion(question, { now: new Date("2026-10-05"), context })).toBe(false);
      expect(student).not.toHaveProperty("answer");
      expect(student.choices?.some(choice => Object.hasOwn(choice, "correct"))).toBe(false);
    }
    const marker = 'ação **literal** _crase_ [texto](url) <script>alert("x")</script> & à';
    const escaped = renderToStaticMarkup(<LessonBlockList blocks={[{ stableId: "escaping", type: "note", payload: { type: "note", content: marker } }]}/>);
    const parsed = new DOMParser().parseFromString(escaped, "text/html");
    expect(parsed.querySelector("script")).toBeNull();
    expect(parsed.body.textContent).toContain(marker);
  });
});
