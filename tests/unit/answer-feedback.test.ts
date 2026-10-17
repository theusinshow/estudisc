import { describe, expect, it } from "vitest";
import { questionSchema } from "@/features/questions/contracts";
import { wrongAnswerFeedback } from "@/features/questions/answer-feedback";
import { questionReward } from "@/features/gamification/study-rewards";

const base = { version: 1, subjectCode: "CIE", primaryConceptId: "c1", conceptIds: ["c1"], difficulty: "direct", cognitiveOperations: ["identify"], stem: "Pergunta", provenance: { type: "human_created" }, status: "published", explanation: "Porque sim." } as const;
const choice = questionSchema.parse({ ...base, id: "q1", type: "multiple_choice", choices: [{ id: "a", content: "A", correct: true }, { id: "b", content: "B", correct: false, rationale: "B confunde trajetória com deslocamento." }, { id: "c", content: "C", correct: false }], answer: { kind: "multiple_choice", choiceId: "a" } });
const matching = questionSchema.parse({ ...base, id: "q2", type: "matching", items: [{ id: "i1", label: "1" }, { id: "i2", label: "2" }], destinations: [{ id: "d1", label: "x" }, { id: "d2", label: "y" }], answer: { kind: "matching", pairs: { i1: "d1", i2: "d2" } } });

describe("wrong answer feedback", () => {
  it("explains the chosen option on the first failure without revealing the solution", () => {
    expect(wrongAnswerFeedback(choice, "b", 1)).toEqual({ choiceFeedback: "B confunde trajetória com deslocamento.", itemResults: undefined, solutionShown: false, explanation: undefined, answerKey: undefined });
    expect(wrongAnswerFeedback(choice, "c", 1).choiceFeedback).toBeUndefined();
  });
  it("marks each pair and opens the solution with the answer key on the second failure", () => {
    expect(wrongAnswerFeedback(matching, { i1: "d1", i2: "d1" }, 1)).toMatchObject({ itemResults: [{ itemId: "i1", correct: true }, { itemId: "i2", correct: false }], answerKey: undefined });
    expect(wrongAnswerFeedback(matching, { i1: "d2", i2: "d1" }, 2)).toMatchObject({ solutionShown: true, explanation: "Porque sim.", answerKey: { kind: "matching", pairs: { i1: "d1", i2: "d2" } } });
  });
});

describe("question reward", () => {
  const passed = { outcome: "passed", hintLevel: 0, solutionRevealed: false };
  it("gives full XP only to the first independent try", () => {
    expect(questionReward(passed, 0)).toBe("first_try");
    expect(questionReward(passed, 1)).toBe("assisted");
    expect(questionReward({ ...passed, hintLevel: 1 }, 0)).toBe("assisted");
    expect(questionReward({ ...passed, solutionRevealed: true }, 0)).toBeUndefined();
    expect(questionReward({ ...passed, outcome: "failed" }, 0)).toBeUndefined();
  });
});
