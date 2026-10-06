import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LessonBlockList } from "@/features/lessons/blocks";
import { QuestionPanel } from "@/features/activities/components/question-panel";
import { studentQuestion } from "@/features/questions/student-view";
import { evaluateQuestion, canExposeQuestion } from "@/features/questions/api";
import { GH_BATCHES, GH_PILOT, buildGhPack, loadGhInputs } from "../tools/science-import/history-geography";
import { validateConceptMap } from "../tools/science-import/mapper";
import { auditGhPack } from "../tools/science-import/qa/history-geography-audit";

describe("History/Geography v2 compatible draft integration", () => {
  it("preserves49lessons/392keys/293atomic targets in one complete pack under the authorized2MiB limit", () => {
    const ids = [...new Set([...GH_PILOT, ...GH_BATCHES.flat()])].sort();
    expect(ids).toHaveLength(49);
    const result = buildGhPack(process.cwd(), ids, 7);
    expect(auditGhPack(result.pack)).toMatchObject({ lessons: 49, questions: 392, concepts: 293, blocks: 670, pendingMedia: 35, sourceFilesUnchanged: 753 });
    expect(result.byteLength + 1).toBeGreaterThan(1048576);
    expect(result.byteLength + 1).toBeLessThanOrEqual(2097152);
    const { inputs, originals } = loadGhInputs(process.cwd());
    const existing = JSON.parse(readFileSync(".estudisc-agent-context/EXISTING-CONCEPTS.json", "utf8")) as { id: string }[];
    expect(() => validateConceptMap(inputs.conceptMap, originals.flatMap(row => row.original.lesson.concepts.map(concept => concept.id)), new Set(existing.map(row => row.id)))).not.toThrow();
    expect(originals.find(row => row.lessonId === "GH-06")!.original.lesson.concepts).toHaveLength(5);
  });
  it("detects answer/text corruption rather than trusting upstream QA or an intact sidecar", () => {
    const { pack } = buildGhPack(process.cwd(), ["GH-02"], 1);
    const corrupt = structuredClone(pack); corrupt.questions[0].explanation = "changed";
    expect(() => auditGhPack(corrupt)).toThrow();
    const lost = structuredClone(pack); lost.track.modules[0].lessons[0].blocks[0].payload.content = "lost";
    expect(() => auditGhPack(lost)).toThrow("missing educational text");
  });
  it("renders the eight pilots with shared core and keeps draft answers/evidence out of study selection", () => {
    {
      const { pack } = buildGhPack(process.cwd(), GH_PILOT, 1);
      for (const lesson of pack.track.modules[0].lessons) {
        const html = renderToStaticMarkup(<LessonBlockList blocks={lesson.blocks.map(block => ({ stableId: block.id, type: block.type, payload: block.payload }))}/>);
        expect(new DOMParser().parseFromString(html, "text/html").body.textContent).not.toMatch(/Bloco inválido|Conteúdo inválido|renderer aprovado/);
      }
      for (const question of pack.questions) {
        const html = renderToStaticMarkup(<QuestionPanel question={studentQuestion(question)} activityStableId={`${question.id}-ACT`}/>);
        const document = new DOMParser().parseFromString(html, "text/html");
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(5);
        for (const choice of question.choices ?? []) expect(evaluateQuestion(question, choice.id)).toMatchObject({ correct: choice.correct, evidenceEligible: true });
        for (const context of ["training", "review", "assessment"] as const) expect(canExposeQuestion(question, { now: new Date("2026-10-05"), context })).toBe(false);
      }
    }
  });
});
