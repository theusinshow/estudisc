/** Display-time wording for imported text whose authoring labels are kept in the immutable published version. */
const PROPOSED_GOAL = /^Objetivo proposto desta exploração:\s*/;

/** The goal of a source-derived exploration is shown as a plain goal; its provenance stays in the pack metadata. */
export function studentPredictionPrompt(content: string) {
  return content.replace(PROPOSED_GOAL, "Objetivo: ");
}

// Authoring placeholders for media still to be produced; the student sees nothing instead of a ticket ID.
const PLACEHOLDER = /^(Ilustração pendente: [A-Z0-9-]+\.|Componente determinístico pendente de implementação e validação\.)$/;

/** Content without authoring placeholder paragraphs; empty when the block was only a placeholder. */
export function withoutPlaceholders(content: string) {
  return content.split(/\n\s*\n/).filter(paragraph => !PLACEHOLDER.test(paragraph.trim())).join("\n\n").trim();
}

/** A titled-text block that would render nothing for the student once placeholders are dropped. */
export function isPlaceholderOnly(payload: unknown) {
  const content = (payload as { content?: unknown } | null)?.content;
  return typeof content === "string" && content.trim() !== "" && withoutPlaceholders(content) === "";
}

/** "Observe" should add something: drop paragraphs that only repeat the question already on screen. */
export function withoutRepeatedPrompt(text: string, prompt: string) {
  const asked = new Set(prompt.split(/\n\s*\n/).map(paragraph => paragraph.trim()));
  const kept = text.split(/\n\s*\n/).filter(paragraph => !asked.has(paragraph.trim())).join("\n\n").trim();
  return kept || text;
}
