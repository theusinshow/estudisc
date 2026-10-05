import { renderToStaticMarkup } from "react-dom/server";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { LessonBlockList } from "@/features/lessons/blocks";
import { QuestionPanel } from "@/features/activities/components/question-panel";
import { studentQuestion } from "@/features/questions/student-view";
import { canExposeQuestion, evaluateQuestion } from "@/features/questions/api";
import { trackPackV2Schema, validateTrackPack } from "@/features/import/api";
import { SCIENCE_DRAFT_PACK } from "../tools/science-import/paths";
import { auditAdaptedPack, auditEditorialSidecar, jsonFile, SOURCE_ROOT } from "../tools/science-import/qa/adapted-pack-audit";

const artifact = process.env.SCIENCE_QA_PACK ?? SCIENCE_DRAFT_PACK;
describe("independent Science adapted pack QA", () => {
  it("preserves source text, questions, mappings and all source files", () => {
    const pack = trackPackV2Schema.parse(jsonFile(artifact));
    expect(validateTrackPack(pack).ok).toBe(true);
    const result = auditAdaptedPack(pack);
    auditEditorialSidecar(join(dirname(artifact), "editorial-sidecar.json"), pack);
    expect(result.sourceFilesUnchanged).toBe(620);
    expect(result.questions).toBe(result.lessons * 8);
  });

  it("detects meaning corruption even when an adapter retains an intact editorial sidecar", () => {
    const pack = trackPackV2Schema.parse(jsonFile(artifact));
    const changed = structuredClone(pack);
    const block = changed.track.modules.flatMap(module => module.lessons).flatMap(lesson => lesson.blocks).find(candidate => candidate.type === "note");
    expect(block).toBeDefined();
    block!.payload.content = "Texto educacional removido pelo adaptador.";
    expect(() => auditAdaptedPack(changed)).toThrow("missing educational text");
    const wrongAnswer = structuredClone(pack);
    wrongAnswer.questions[0].answer = { kind: "multiple_choice", choiceId: "INVALID" };
    expect(() => auditAdaptedPack(wrongAnswer)).toThrow();
  });

  it("renders every adapted block and question through existing core SSR and preserves answer evaluation", () => {
    const pack = trackPackV2Schema.parse(jsonFile(artifact));
    for (const lesson of pack.track.modules.flatMap(module => module.lessons)) {
      const sourceBlocks = jsonFile(`${SOURCE_ROOT}/workspace/${lesson.id}/approved/pack.json`).lesson.blocks;
      const markup = renderToStaticMarkup(<LessonBlockList blocks={lesson.blocks.map(block => ({ stableId: block.id, type: block.type, payload: block.payload }))}/>);
      const document = new DOMParser().parseFromString(markup, "text/html");
      expect(document.body.textContent, lesson.id).not.toMatch(/ainda não possui renderer aprovado|Conteúdo inválido|Bloco inválido/i);
      for (const block of lesson.blocks) {
        if (block.type === "figure") {
          const image = Array.from(document.images).find(image => image.alt === block.payload.alt && image.getAttribute("src") === block.payload.src);
          expect(image, block.id).toBeDefined();
          const description = image!.closest("figure")!.querySelector("details.lesson-figure-description");
          expect(description, block.id).not.toBeNull();
          expect(description!.querySelector("summary")?.textContent, block.id).toBe("Descrição da imagem");
          const renderedParagraphs = Array.from(description!.querySelectorAll("p")).map(paragraph => Array.from(paragraph.childNodes).map(node => node.nodeName === "BR" ? "\n" : node.textContent).join(""));
          expect(renderedParagraphs, block.id).toEqual((block.payload.longDescription as string).split(/\n\s*\n/));
        } else {
          expect(document.body.textContent, block.id).toContain(block.payload.title);
          const editorial = sourceBlocks.find((candidate: { id: string }) => candidate.id === block.id) as { content?: string; items?: string[]; prompt?: string; answer?: string; reasoning?: string; answerGuide?: { mustMention: string[] } };
          for (const text of [editorial.content, ...(editorial.items ?? []), editorial.prompt, editorial.answer, editorial.reasoning, ...(editorial.answerGuide?.mustMention ?? [])].filter(Boolean)) expect(document.body.textContent, block.id).toContain(text);
        }
      }
    }
    for (const question of pack.questions) {
      const markup = renderToStaticMarkup(<QuestionPanel question={studentQuestion(question)} activityStableId={`${question.id}-ACT`}/>);
      const document = new DOMParser().parseFromString(markup, "text/html");
      expect(document.body.textContent, question.id).toContain(question.stem);
      expect(document.querySelectorAll('input[type="radio"]'), question.id).toHaveLength(5);
      for (const choice of question.choices ?? []) {
        expect(document.body.textContent, question.id).toContain(choice.content);
        expect(evaluateQuestion(question, choice.id)).toMatchObject({ correct: choice.correct, evidenceEligible: true });
      }
      expect(canExposeQuestion(question, { now: new Date("2026-10-05"), context: "training" })).toBe(false);
      expect(canExposeQuestion(question, { now: new Date("2026-10-05"), context: "review" })).toBe(false);
      expect(canExposeQuestion(question, { now: new Date("2026-10-05"), context: "assessment" })).toBe(false);
      const student = studentQuestion(question);
      expect(student).not.toHaveProperty("answer");
      expect(student).not.toHaveProperty("explanation");
      expect(student.choices?.every(choice => !Object.hasOwn(choice, "correct"))).toBe(true);
    }
  });
});
