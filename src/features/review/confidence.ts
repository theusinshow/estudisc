import { z } from "zod";

/**
 * ADR 0071 confidence check. Optional, self-reported before the answer is checked. It changes review priority only:
 * a correct guess is not independent (no spacing step, open mistakes stay open) and a confident error is a blind
 * spot that leads the review queue. Mastery evidence strength is unchanged.
 */
export const confidenceSchema = z.enum(["sure", "unsure", "guess"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export function countsAsIndependent(input: Readonly<{ hintLevel: number; solutionRevealed: boolean; confidence?: Confidence | null }>) {
  return !input.hintLevel && !input.solutionRevealed && input.confidence !== "guess";
}

export function isBlindSpot(correct: boolean, confidence?: Confidence | null) {
  return !correct && confidence === "sure";
}

export const BLIND_SPOT_SUMMARY = "Ponto cego: você tinha certeza e errou. Vale rever primeiro.";
export const BLIND_SPOT_REASON = "Ponto cego: você tinha certeza e errou. Revise antes dos outros.";
