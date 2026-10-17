/**
 * One area per subject. Tracks name the same subject differently ("Português" in the IFSC 2027 week track,
 * "Língua Portuguesa" in the subject track); stored titles stay as imported and are normalized on read.
 */
const SUBJECT_ALIASES: Readonly<Record<string, string>> = { "Português": "Língua Portuguesa" };

export function subjectAreaTitle(title: string) {
  const trimmed = title.trim();
  return SUBJECT_ALIASES[trimmed] ?? trimmed;
}

/** Distinct canonical areas of a Concept, so a Concept in two tracks of one subject counts once. */
export function subjectAreas(titles: readonly string[]) {
  return [...new Set(titles.map(subjectAreaTitle))];
}
