import { describe, expect, it } from "vitest";
import { shuffleQuestionChoices } from "../../tools/shared/shuffle-choices";

describe("shuffleQuestionChoices", () => {
  it("uses the question ID as a deterministic seed and preserves choice references", () => {
    const input = {
      id: "Q-MAT-15-determinism",
      version: 1,
      stem: "Qual alternativa está correta?",
      choices: [
        { id: "A", content: "Primeira", correct: true, rationale: "Alternativa A está correta." },
        { id: "B", content: "Segunda", correct: false, rationale: "Confira a letra A." },
        { id: "C", content: "Terceira", correct: false, rationale: "" },
        { id: "D", content: "Quarta", correct: false, rationale: "" },
        { id: "E", content: "Quinta", correct: false, rationale: "" },
      ],
      answer: { kind: "multiple_choice", choiceId: "A" },
      explanation: { text: "A alternativa A é a correta; a letra B não é." },
      rationale: "A letra A corresponde à resposta.",
    };

    const first = shuffleQuestionChoices(input);
    const second = shuffleQuestionChoices(input);

    expect(first).toEqual(second);
    expect(first.changed).toBe(true);
    expect(input.choices.map((choice) => choice.id)).toEqual(["A", "B", "C", "D", "E"]);
    expect(first.question.choices.map((choice) => choice.id)).toEqual(["A", "B", "C", "D", "E"]);
    expect(first.question.choices.filter((choice) => choice.correct)).toHaveLength(1);

    const correct = first.question.choices.find((choice) => choice.correct)!;
    expect(first.question.answer.choiceId).toBe(correct.id);

    const idFor = (content: string) => first.question.choices.find((choice) => choice.content === content)!.id;
    expect(first.question.explanation.text).toBe(`A alternativa ${idFor("Primeira")} é a correta; a letra ${idFor("Segunda")} não é.`);
    expect(first.question.rationale).toBe(`A letra ${idFor("Primeira")} corresponde à resposta.`);
    expect(first.question.choices.find((choice) => choice.content === "Segunda")!.rationale).toBe(`Confira a letra ${idFor("Primeira")}.`);
  });
});