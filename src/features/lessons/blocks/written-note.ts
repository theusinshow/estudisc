/**
 * Notes the student answers in writing, recognized from the imported editorial role (never from a track name).
 * "recall": prompt first, then the ideas a good answer mentions, shown only after the student writes and checks.
 * "open": an activity to do; the student gets a field, no answer is revealed.
 */
export type WrittenRole = "recall" | "open";
export type WrittenNote = { role: WrittenRole; prompt: string; ideas: string[] };

type NotePayload = { title?: unknown; content?: unknown; editorial?: { type?: unknown } };

export function writtenNoteRole(payload: unknown): WrittenRole | undefined {
  const note = (payload ?? {}) as NotePayload;
  const type = note.editorial?.type, title = typeof note.title === "string" ? note.title : "";
  if (type === "EXIT_TICKET") return "recall";
  if (type === "ACTIVE_LEARNING" || type === "CALLOUT" && /^Atividade\b/i.test(title)) return "open";
  return undefined;
}

// Authoring checklists (rubric criteria and the generic response format) are for the author, not the student.
const isRubricLine = (paragraph: string) => /^[a-zà-ú]/.test(paragraph) || /^Resposta curta ou classificação justificada\.?$/i.test(paragraph);

export function splitWrittenNote(role: WrittenRole, content: string): WrittenNote {
  const paragraphs = content.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean).filter(paragraph => !isRubricLine(paragraph));
  if (role === "recall") return { role, prompt: paragraphs[0] ?? "", ideas: paragraphs.slice(1) };
  return { role, prompt: paragraphs.join("\n\n"), ideas: [] };
}

/** What a written note shows before "Conferir", what opens after it, and authoring lines never shown. */
export function writtenNoteText(payload: unknown): { visible: string[]; afterCheck: string[]; never: string[] } | undefined {
  const role = writtenNoteRole(payload), content = (payload as NotePayload | null)?.content;
  if (!role || typeof content !== "string") return undefined;
  const note = splitWrittenNote(role, content);
  const never = content.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(paragraph => paragraph && isRubricLine(paragraph));
  return { visible: note.prompt.split(/\n\s*\n/), afterCheck: note.ideas, never };
}
