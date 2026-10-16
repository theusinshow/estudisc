import { assessmentTemplateSchema, validateAssessmentComposition, type AssessmentTemplate } from "@/features/assessments/contracts";
import type { Question } from "@/features/questions/contracts";

/**
 * Builds full IFSC simulado templates (ADR 0065): 28 multiple-choice Questions, seven per area,
 * four hours, shuffled choices, published. Composition is checked with the engine's own validator.
 */
export const SIMULADO_SUBJECTS = ["MAT", "POR", "CIE", "GH"] as const;
export const SIMULADO_PER_SUBJECT = 7;
export const SIMULADO_DURATION_MINUTES = 240;
type Subject = typeof SIMULADO_SUBJECTS[number];
type Ref = Readonly<{ id: string; version: number }>;

export type SimuladoInput = Readonly<{
  number: number;
  /** Combined IFSC exam Track used as the template's home Track. */
  trackId: string;
  /** Subject Tracks owning the Questions' Concepts (assessment scope union). */
  scopeTrackIds?: readonly string[];
  items: Readonly<Record<Subject, readonly Ref[]>>;
  availableAt?: string;
}>;

export const simuladoTemplateId = (number: number) => `ifsc-simulado-${number}`;

export function buildSimuladoTemplate(input: SimuladoInput): AssessmentTemplate {
  if (!Number.isInteger(input.number) || input.number < 1) throw new Error("Simulado number must be a positive integer");
  for (const subject of SIMULADO_SUBJECTS) if (input.items[subject]?.length !== SIMULADO_PER_SUBJECT) throw new Error(`Simulado ${input.number} needs ${SIMULADO_PER_SUBJECT} ${subject} Questions`);
  return assessmentTemplateSchema.parse({
    id: simuladoTemplateId(input.number), version: 1, title: `Simulado IFSC ${input.number}`, kind: "FULL_SIMULATION",
    trackId: input.trackId, ...(input.scopeTrackIds?.length ? { scopeTrackIds: [...input.scopeTrackIds] } : {}),
    durationMinutes: SIMULADO_DURATION_MINUTES, shuffleChoices: true, status: "published",
    items: SIMULADO_SUBJECTS.flatMap(subject => input.items[subject].map(ref => ({ id: ref.id, version: ref.version }))),
    ...(input.availableAt ? { availableAt: input.availableAt } : {})
  });
}

/**
 * Throws when the Questions cannot form this template (real engine rule set). `assumePublished`
 * previews drafts as if their Admin Direct publication already happened; the database import
 * still checks actual publication status.
 */
export function validateSimulado(template: AssessmentTemplate, bank: readonly Question[], options: Readonly<{ assumePublished?: boolean }> = {}) {
  const questions = template.items.map(ref => {
    const question = bank.find(item => item.id === ref.id && item.version === ref.version);
    if (!question) throw new Error(`Missing Question ${ref.id} v${ref.version}`);
    return options.assumePublished && question.status === "draft" ? { ...question, status: "published" as const } : question;
  });
  validateAssessmentComposition(template, questions, true);
  return template;
}

/**
 * Partitions a Question bank into simulados: an explicit `simulado` assignment wins; otherwise
 * Questions are taken in id order, seven per subject per simulado. No Question repeats.
 */
export function partitionSimulados(bank: ReadonlyArray<Readonly<{ question: Question; simulado?: number }>>, count: number) {
  const result = Array.from({ length: count }, () => Object.fromEntries(SIMULADO_SUBJECTS.map(subject => [subject, [] as Ref[]])) as Record<Subject, Ref[]>);
  for (const subject of SIMULADO_SUBJECTS) {
    const entries = bank.filter(entry => entry.question.subjectCode === subject);
    const explicit = entries.filter(entry => entry.simulado !== undefined);
    for (const entry of explicit) {
      const target = result[entry.simulado! - 1];
      if (!target) throw new Error(`${entry.question.id} targets simulado ${entry.simulado} outside 1..${count}`);
      target[subject].push({ id: entry.question.id, version: entry.question.version });
    }
    const rest = entries.filter(entry => entry.simulado === undefined).sort((a, b) => a.question.id.localeCompare(b.question.id));
    // Evenly spaced picks dealt round-robin, so each simulado samples the whole syllabus.
    const missing = result.reduce((sum, target) => sum + Math.max(0, SIMULADO_PER_SUBJECT - target[subject].length), 0);
    const picks = rest.length <= missing ? rest : Array.from({ length: missing }, (_, k) => rest[Math.floor(k * rest.length / missing)]);
    let turn = 0;
    for (const next of picks) {
      let guard = 0;
      while (result[turn % count][subject].length >= SIMULADO_PER_SUBJECT && guard++ < count) turn++;
      const target = result[turn % count];
      if (target[subject].length >= SIMULADO_PER_SUBJECT) break;
      target[subject].push({ id: next.question.id, version: next.question.version });
      turn++;
    }
  }
  return result;
}
