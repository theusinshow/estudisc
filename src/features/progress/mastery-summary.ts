import { masteryStateLabels, type MasteryState } from "@/features/mastery/mastery-policy";

const order: readonly MasteryState[] = ["unseen", "introduced", "understood", "practicing", "strong", "mastered"];

export type ConceptMasterySummary = Readonly<{
  totalConcepts: number;
  conceptsWithEvidence: number;
  weakestState: MasteryState;
  weakestLabel: string;
}>;

/**
 * The lesson shows its weakest practiced concept, so one strong concept cannot hide a weak one;
 * unpracticed concepts are reported by the coverage count instead of turning the label into "Não visto".
 */
export function summarizeConceptMastery(states: ReadonlyArray<Readonly<{ state: MasteryState }>>): ConceptMasterySummary {
  const practiced = states.filter(({ state }) => state !== "unseen");
  const weakestState = practiced.length === 0 ? "unseen" : practiced.reduce<MasteryState>(
    (weakest, { state }) => (order.indexOf(state) < order.indexOf(weakest) ? state : weakest),
    "mastered"
  );

  return {
    totalConcepts: states.length,
    conceptsWithEvidence: practiced.length,
    weakestState,
    weakestLabel: masteryStateLabels[weakestState]
  };
}
