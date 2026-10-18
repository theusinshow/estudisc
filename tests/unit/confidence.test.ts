import { describe, expect, it } from "vitest";
import { confidenceSchema, countsAsIndependent, isBlindSpot } from "@/features/review/confidence";

describe("ADR 0071 confidence", () => {
  it("treats a correct guess as not independent, without changing the hint and solution rules", () => {
    expect(countsAsIndependent({ hintLevel: 0, solutionRevealed: false })).toBe(true);
    expect(countsAsIndependent({ hintLevel: 0, solutionRevealed: false, confidence: "sure" })).toBe(true);
    expect(countsAsIndependent({ hintLevel: 0, solutionRevealed: false, confidence: "unsure" })).toBe(true);
    expect(countsAsIndependent({ hintLevel: 0, solutionRevealed: false, confidence: "guess" })).toBe(false);
    expect(countsAsIndependent({ hintLevel: 1, solutionRevealed: false, confidence: "sure" })).toBe(false);
  });
  it("marks only confident errors as blind spots", () => {
    expect(isBlindSpot(false, "sure")).toBe(true);
    expect(isBlindSpot(false, "guess")).toBe(false);
    expect(isBlindSpot(true, "sure")).toBe(false);
    expect(isBlindSpot(false, undefined)).toBe(false);
  });
  it("accepts only the three levels", () => {
    expect(confidenceSchema.safeParse("certain").success).toBe(false);
  });
});
