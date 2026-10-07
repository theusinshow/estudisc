import { expect, it } from "vitest";
import { linearExplorerSchema, numericExplorerSchema } from "@/features/lessons/blocks/numeric-explorer-schema";
import { educationalFeedback } from "@/features/activities/components/educational-feedback";
import { educationalActivitySchema } from "@/features/activities/application/educational-activity";

const config = { mode: "linear", title: "Modelo", variableLabel: "Entrada", outputLabel: "Resultado", min: -10, max: 10, step: 1, initial: 0, slope: 2, intercept: 3, explanation: "Observe o resultado." };
it("retains the legacy percent payload and validates explicit model/range/step without executing formulas", () => {
  expect(numericExplorerSchema.parse({ initialValue: 200, initialPercentage: 15 })).toEqual({ initialValue: 200, initialPercentage: 15 });
  expect(linearExplorerSchema.safeParse(config).success).toBe(true);
  expect(linearExplorerSchema.safeParse({ ...config, min: 10 }).success).toBe(false);
  expect(linearExplorerSchema.safeParse({ ...config, initial: 0.5 }).success).toBe(false);
  expect(linearExplorerSchema.safeParse({ ...config, step: 0 }).success).toBe(false);
  expect(linearExplorerSchema.safeParse({ ...config, slope: Infinity }).success).toBe(false);
});
it("shows partial progress while preserving a failed local evaluation and no synthetic grade fields", () => {
  const matching = educationalActivitySchema.parse({ type: "matching", items: [{ id: "a", label: "A" }, { id: "b", label: "B" }], destinations: [{ id: "x", label: "X" }, { id: "y", label: "Y" }], expected: { a: "x", b: "y" } });
  expect(educationalFeedback(matching, { a: "y", b: "y" })).toMatchObject({ outcome: "failed", correct: false, partial: true, matched: 1, total: 2, evaluatorVersion: "educational.v1" });
  expect(educationalFeedback(matching, { a: "x", b: "y" })).toMatchObject({ outcome: "passed", correct: true, partial: false });
  const highlight = educationalActivitySchema.parse({ type: "text-highlight", items: [{ id: "a", label: "A" }, { id: "b", label: "B" }], expectedIds: ["a"] });
  expect(educationalFeedback(highlight, ["a", "b"])).toMatchObject({ correct: false, partial: true, matched: 1, total: 1 });
});
