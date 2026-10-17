/** Display-time wording for imported text whose authoring labels are kept in the immutable published version. */
const PROPOSED_GOAL = /^Objetivo proposto desta exploração:\s*/;

/** The goal of a source-derived exploration is shown as a plain goal; its provenance stays in the pack metadata. */
export function studentPredictionPrompt(content: string) {
  return content.replace(PROPOSED_GOAL, "Objetivo: ");
}
