import { describe, expect, it } from "vitest";
import { parseNumericResponse } from "@/features/activities/application/numeric-response";
import { evaluateEducationalActivity, parseEducationalActivityConfig } from "@/features/activities/application/educational-activity";

describe("parseNumericResponse", () => {
  it("accepts decimal comma, a trailing percent sign or unit word, and a currency prefix", () => {
    expect(parseNumericResponse("0,5")).toBe(0.5);
    expect(parseNumericResponse(" 75% ")).toBe(75);
    expect(parseNumericResponse("75 %")).toBe(75);
    expect(parseNumericResponse("4 copos")).toBe(4);
    expect(parseNumericResponse("12,5 km/h")).toBe(12.5);
    expect(parseNumericResponse("R$ 10,90")).toBe(10.9);
    expect(parseNumericResponse(-3)).toBe(-3);
  });

  it("treats % as a label, never as a division by 100", () => {
    expect(parseNumericResponse("75%")).not.toBe(0.75);
  });

  it("rejects blanks, fractions, lists and digits hidden in the suffix", () => {
    for (const value of ["", "  ", "1/2", "4/3", "1,2,3", "4 e 5", "abc", "%", "4 copos 2", null, {}]) {
      expect(parseNumericResponse(value)).toBeNaN();
    }
  });

  it("is used by the educational numeric evaluator", () => {
    const config = parseEducationalActivityConfig({ type: "numeric", expected: 75 });
    expect(evaluateEducationalActivity(config, "75%").correct).toBe(true);
    expect(evaluateEducationalActivity(config, "7,5%").correct).toBe(false);
  });
});
