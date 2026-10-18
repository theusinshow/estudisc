/**
 * Presentation-only subject code for the identification tab (`data-subject` → `--subject`).
 * Reads the visible subject name; unknown titles get no tab color (ink on panel), never a guess.
 */
export function subjectCodeFromTitle(title: string | undefined): "MAT" | "POR" | "CIE" | "GH" | undefined {
  const text = title?.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() ?? "";
  if (text.includes("matematica")) return "MAT";
  if (text.includes("portugues")) return "POR";
  if (text.includes("ciencias")) return "CIE";
  if (text.includes("geografia") || text.includes("historia")) return "GH";
  return undefined;
}

const SUBJECT_NAMES = { MAT: "Matemática", POR: "Língua Portuguesa", CIE: "Ciências", GH: "Geografia e História" } as const;

/** Visible subject name for a track title ("IFSC 2027 — Matemática" → "Matemática"); unknown titles stay as they are. */
export function subjectNameFromTitle(title: string): string {
  const code = subjectCodeFromTitle(title);
  return code ? SUBJECT_NAMES[code] : title;
}
