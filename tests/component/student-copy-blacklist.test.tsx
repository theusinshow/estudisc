import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import blacklist from "../../scripts/student-copy-blacklist.json";
import { LessonBlockList } from "@/features/lessons/blocks";
import { QuestionPanel } from "@/features/activities/components/question-panel";
import { studentQuestion } from "@/features/questions/student-view";
import { questionSchema } from "@/features/questions/contracts";
import { studentConceptLabel } from "@/features/concepts/student-label";
import { calculateConceptMasteryV2 } from "@/features/mastery/mastery-policy-v2";

type Pack = { questions: unknown[]; track: { modules: { lessons: { id: string; concepts?: { title: string }[]; blocks: { id: string; type: string; payload: Record<string, unknown> }[] }[] }[] } };
const root = "packs/drafts";
const packs = readdirSync(root).flatMap(dir => readdirSync(join(root, dir)).filter(file => file.endsWith(".pack.json")).map(file => JSON.parse(readFileSync(join(root, dir, file), "utf8")) as Pack));
const everywhere = blacklist.everywhere.map(rule => ({ ...rule, regex: new RegExp(rule.pattern, "i") }));
const visibleText = (markup: string) => {
  const document = new DOMParser().parseFromString(markup, "text/html");
  document.querySelectorAll(".math-visual").forEach(node => node.remove());
  return document.body.textContent ?? "";
};
const offenders = (text: string) => everywhere.filter(rule => rule.regex.test(text)).map(rule => `${rule.pattern} (${rule.why})`);

describe("student-facing copy never shows internal wording", () => {
  it("covers every draft pack", () => expect(packs.length).toBeGreaterThan(3));

  it("in rendered lesson blocks", () => {
    const found: string[] = [];
    for (const lesson of packs.flatMap(pack => pack.track.modules.flatMap(module => module.lessons))) {
      const text = visibleText(renderToStaticMarkup(<LessonBlockList blocks={lesson.blocks.map(block => ({ stableId: block.id, type: block.type, payload: block.payload }))} />));
      for (const rule of offenders(text)) found.push(`${lesson.id}: ${rule}`);
    }
    expect(found).toEqual([]);
  });

  it("in rendered questions", () => {
    const found: string[] = [];
    for (const raw of packs.flatMap(pack => pack.questions)) {
      const question = questionSchema.parse(raw);
      for (const rule of offenders(visibleText(renderToStaticMarkup(<QuestionPanel question={studentQuestion(question)} activityStableId="activity" />)))) found.push(`${question.id}: ${rule}`);
    }
    expect(found).toEqual([]);
  });

  it("in published shapes that drafts do not carry (source-goal predictions, recall rubrics)", () => {
    const blocks = [
      { stableId: "p", type: "prediction", payload: { type: "prediction", title: "Preveja", content: "Objetivo proposto desta exploração: Distinguir distância de deslocamento.\n\nQual interpretação é correta?", observation: "Observe a ida e a volta.", explanation: "O deslocamento é zero." } },
      { stableId: "r", type: "note", payload: { type: "note", title: "Recuperação ativa", content: "Explique movimento.\n\nUm corpo se move em relação a um referencial.\n\ncorreção explícita de pelo menos um erro conceitual da aula", editorial: { type: "EXIT_TICKET" } } }
    ];
    const text = visibleText(renderToStaticMarkup(<LessonBlockList blocks={blocks} />));
    expect(offenders(text)).toEqual([]);
    expect(text).toContain("Explique movimento.");
    expect(text).not.toContain("Um corpo se move"); // opens only after "Conferir"
  });

  it("in concept labels and mastery reasons", () => {
    const rules = blacklist.conceptLabels.map(rule => new RegExp(rule.pattern)); // case-sensitive: a lowercase start is the defect
    const titles = packs.flatMap(pack => pack.track.modules.flatMap(module => module.lessons.flatMap(lesson => lesson.concepts ?? []))).map(concept => studentConceptLabel(concept.title));
    expect(titles.filter(title => rules.some(rule => rule.test(title)))).toEqual([]);
    const reasons = calculateConceptMasteryV2([], new Date()).reasons.join(" ");
    expect(offenders(reasons)).toEqual([]);
  });
});
