/**
 * The student-facing name of a Concept. Imported titles keep authoring scope notes ("em nível fundamental",
 * "quando pertinente"); the stored title and ID stay unchanged, only the display drops them.
 */
const SCOPE_NOTES = [/\s+como aplicação contextual quando pertinente$/i, /\s+quando pertinente$/i, /\s+em nível (?:fundamental|escolar|introdutório|conceitual|básico|essencial|funcional)$/i];

export function studentConceptLabel(title: string) {
  const label = SCOPE_NOTES.reduce((text, note) => text.replace(note, ""), title.trim());
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}
