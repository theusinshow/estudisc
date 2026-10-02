import { describe, expect, it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { questionSchema } from "@/features/questions/contracts";
import { evaluateQuestion } from "@/features/questions/evaluation";

describe("MAT-PREREQ editorial answers", () => {
  const expectedValues = [1 / 4, 0.4 * 100, (6 / 2) * 5];

  it.each(expectedValues.map((value, index) => ({ id: `Q-MAT-PREREQ-${index + 1}`, value })))
    ("accepts only the mathematically correct alternative for $id", ({ id, value }) => {
      const question = questionSchema.parse(source.questions.find(question => question.id === id));
      const correctChoices = question.choices!.filter(choice => {
        const numericValue = Number(choice.content.replace("%", "").replace(",", "."));
        const correct = numericValue === value;
        expect(evaluateQuestion(question, choice.id).correct).toBe(correct);
        return correct;
      });
      expect(correctChoices).toHaveLength(1);
    });
});
