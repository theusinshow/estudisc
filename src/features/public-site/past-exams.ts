import { pastExamSheetTemplateSchema, PAST_EXAM_SHEET } from "@/features/assessments/sheet-contracts";

type TemplateRow = Readonly<{ id: string; stableId: string; version: number; kind: string; definition: unknown }>;

export type PublicPastExam = Readonly<{
  stableId: string;
  title: string;
  year: number;
  edition: string;
  variant: string;
  appliedOn: string;
  itemCount: number;
  examUrl: string;
  answerKeyUrl: string;
}>;

/**
 * Public catalog for /provas-anteriores: latest version of each answer-sheet template, official IFSC links only.
 * Reserved editions (availableAt in the future) are left out entirely, so nothing reserved reaches a public page.
 */
export function buildPublicPastExams(templates: readonly TemplateRow[], now: Date): PublicPastExam[] {
  const latest = new Map<string, { row: TemplateRow; template: ReturnType<typeof pastExamSheetTemplateSchema.parse> }>();
  for (const row of templates) {
    if (row.kind !== PAST_EXAM_SHEET) continue;
    const parsed = pastExamSheetTemplateSchema.safeParse(row.definition);
    if (!parsed.success) continue;
    const current = latest.get(row.stableId);
    if (!current || current.row.version < row.version) latest.set(row.stableId, { row, template: parsed.data });
  }
  return [...latest.values()]
    .filter(({ template }) => !template.availableAt || now.getTime() >= Date.parse(template.availableAt))
    .map(({ row, template }) => ({
      stableId: row.stableId, title: template.title, year: template.exam.year, edition: template.exam.edition, variant: template.exam.variant,
      appliedOn: template.exam.appliedOn, itemCount: template.items.length, examUrl: template.links.examUrl, answerKeyUrl: template.links.answerKeyUrl
    }))
    .sort((a, b) => b.edition.localeCompare(a.edition) || a.variant.localeCompare(b.variant));
}

export function pastExamYears(exams: readonly PublicPastExam[]) {
  return [...new Set(exams.map(exam => exam.year))].sort((a, b) => b - a);
}

/**
 * Space for 3–5 commented Questions per year, by published Question id. Empty on purpose: today no product
 * Question is mapped to an official edition, and only Questions that already exist in the product may be used.
 */
export const PAST_EXAM_COMMENTED_QUESTIONS: Readonly<Record<number, readonly string[]>> = {};
