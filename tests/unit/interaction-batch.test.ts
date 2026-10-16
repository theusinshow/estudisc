import { describe, expect, it } from "vitest";
import { evaluateQuestion } from "@/features/questions/evaluation";
import { buildInteractionQuestion, interactionAuthoringSchema, scrambledOrder } from "../../tools/estudisc-content-studio/interaction-batch";

const base = { lessonId: "GH-12", conceptId: "gh.c1", difficulty: "direct" as const, explanation: "A ordem segue a cronologia dos acontecimentos estudados na aula." };
const options = { questionId: "GH-12-INT-Q01", subjectCode: "GH", generationRunId: "test" };

describe("interaction authoring", () => {
  it("builds an ordering Question whose displayed order is never the answer", () => {
    const authored = interactionAuthoringSchema.parse({ ...base, type: "ordering", stem: "Ordene os acontecimentos do mais antigo ao mais recente.", items: ["Independência (1822)", "Abolição (1888)", "Proclamação da República (1889)"] });
    const question = buildInteractionQuestion(authored, options);
    const initial = question.items.map(item => item.id);
    expect(question.answer).toEqual({ kind: "ordering", orderedIds: ["i1", "i2", "i3"] });
    expect(initial).not.toEqual(["i1", "i2", "i3"]);
    expect(evaluateQuestion(question, initial).correct).toBe(false);
    expect(evaluateQuestion(question, ["i1", "i2", "i3"]).correct).toBe(true);
  });

  it("builds classification and matching Questions evaluated by the shared evaluator", () => {
    const classification = buildInteractionQuestion(interactionAuthoringSchema.parse({ ...base, type: "classification", stem: "Classifique cada material.",
      items: ["Água destilada", "Ar", "Ouro 24 quilates"], destinations: ["Substância pura", "Mistura"],
      answer: { "Água destilada": "Substância pura", "Ar": "Mistura", "Ouro 24 quilates": "Substância pura" } }), options);
    expect(evaluateQuestion(classification, { i1: "d1", i2: "d2", i3: "d1" }).correct).toBe(true);
    expect(evaluateQuestion(classification, { i1: "d1", i2: "d1", i3: "d1" }).correct).toBe(false);

    const matching = buildInteractionQuestion(interactionAuthoringSchema.parse({ ...base, type: "matching", stem: "Relacione cada gênero à sua função.",
      items: ["Notícia", "Receita", "Anúncio"], destinations: ["Informar um fato", "Instruir um procedimento", "Convencer a comprar"],
      answer: { "Notícia": "Informar um fato", "Receita": "Instruir um procedimento", "Anúncio": "Convencer a comprar" } }), options);
    expect(evaluateQuestion(matching, { i1: "d1", i2: "d2", i3: "d3" }).correct).toBe(true);
  });

  it("rejects incomplete or ambiguous interactions", () => {
    const stem = "Relacione cada item ao seu destino.";
    expect(() => interactionAuthoringSchema.parse({ ...base, type: "ordering", stem, items: ["A", "A", "B"] })).toThrow();
    expect(() => interactionAuthoringSchema.parse({ ...base, type: "classification", stem, items: ["A", "B", "C"], destinations: ["X", "Y"], answer: { A: "X", B: "X" } })).toThrow();
    expect(() => interactionAuthoringSchema.parse({ ...base, type: "classification", stem, items: ["A", "B", "C"], destinations: ["X", "Y"], answer: { A: "X", B: "X", C: "X" } })).toThrow();
    expect(() => interactionAuthoringSchema.parse({ ...base, type: "matching", stem, items: ["A", "B", "C"], destinations: ["X", "Y", "Z"], answer: { A: "X", B: "X", C: "Z" } })).toThrow();
  });

  it("scrambles every length deterministically", () => {
    for (const count of [3, 4, 5, 8]) {
      const order = scrambledOrder(count, `seed-${count}`);
      expect([...order].sort()).toEqual(Array.from({ length: count }, (_, i) => i));
      expect(order).not.toEqual(Array.from({ length: count }, (_, i) => i));
      expect(scrambledOrder(count, `seed-${count}`)).toEqual(order);
    }
  });
});
