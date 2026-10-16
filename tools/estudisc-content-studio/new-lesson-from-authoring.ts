import { z } from "zod";
import { newLessonPackSchema, type NewLessonPack } from "@/features/import/application/new-lesson-contracts";
import { resolveNewLessonContext } from "@/features/import/application/new-lesson-policy";
import type { TrackPackV2 } from "@/features/import/application/track-pack-v2-schema";
import { questionSchema } from "@/features/questions/contracts";

const text = z.string().trim().min(1);
const id = z.string().trim().min(1).max(160);
/** One authored lesson file (ChatGPT/Studio authoring format); untrusted input, validated before conversion. */
export const newLessonAuthoringSchema = z.object({
  lessonId: id, title: text, subject: z.enum(["MAT", "POR", "CIE", "GH"]), estimatedMinutes: z.number().int().min(1).max(240), editalItem: text,
  objectives: z.array(text).min(1),
  concepts: z.array(z.object({ id, title: text, summary: text.optional() })).min(1),
  blocks: z.array(z.object({ id, type: z.enum(["text", "concept", "note", "worked-example", "warning", "summary", "example"]), title: text.optional(), content: text, conceptIds: z.array(id).min(1) })).min(1),
  questions: z.array(z.object({
    id, difficulty: z.enum(["foundation", "direct", "applied", "ifsc"]), conceptIds: z.array(id).min(1), stimulus: z.string().trim().optional().nullable(), stem: text,
    choices: z.array(z.object({ id, content: text, correct: z.boolean(), targetsError: z.string().nullable().optional(), rationale: z.string().trim().optional().nullable() })).min(2),
    explanation: text
  })).min(1),
  exitTicketQuestionIds: z.array(id).min(1),
  sources: z.array(z.object({ title: text, author: text, url: z.url(), accessedAt: text, usage: text })).min(1)
});
export type NewLessonAuthoring = z.infer<typeof newLessonAuthoringSchema>;

// Shared Question `targetsError` enum; free-text authoring labels outside it become "unknown" (no invented class).
const targetErrors = new Set(["conceptual", "procedural", "calculation", "interpretation", "prerequisite", "distractor", "attention", "memory", "unknown"]);
// Authoring has no cognitive-operation tags; this is a declared difficulty-based default, not a reviewed classification.
const operations = { foundation: ["identify"], direct: ["apply"], applied: ["apply", "interpret"], ifsc: ["interpret", "analyze"] } as const;
const prompts = {
  guided_practice: "Responda à checagem rápida.",
  independent_practice: "Resolva sem consultar o exemplo.",
  transfer: "Aplique o que estudou em uma questão no estilo da prova.",
  exit_ticket: "Desafio final: responda sem consultar a aula."
} as const;

/**
 * ADR 0064: converts one authored lesson into a `caderno.lesson-new.v1` pack for an existing module of the given
 * imported Track context, then checks it with the import policy. Output stays a draft; nothing is published.
 */
export function newLessonPackFromAuthoring(input: {
  authoring: unknown; context: TrackPackV2; moduleId: string; authorId: string; generationRunId: string;
  packId?: string; version?: number; prerequisiteConceptIds?: string[];
}): NewLessonPack {
  const a = newLessonAuthoringSchema.parse(input.authoring);
  const moduleRecord = input.context.track.modules.find(m => m.id === input.moduleId);
  if (!moduleRecord) throw new Error(`Module ${input.moduleId} is not part of Track ${input.context.track.id}`);
  if (moduleRecord.subjectCode !== a.subject) throw new Error(`Lesson subject ${a.subject} differs from module subject ${moduleRecord.subjectCode}`);
  const studioSourceId = `src-new-${a.lessonId}`;
  const sources = [
    { id: studioSourceId, type: "ai_generated" as const, title: `Estudisc Content Studio — rascunho da nova aula ${a.lessonId}`, locator: {},
      // The edital item is the author's claim; no official curriculum mapping is created from it.
      metadata: { authorRunId: input.generationRunId, reviewStatus: "pending_human_publication_review", editalItem: a.editalItem, editalMappingStatus: "author_claim_unverified" } },
    ...a.sources.map((source, index) => ({ id: `${studioSourceId}-ref-${String(index + 1).padStart(2, "0")}`, type: "reference" as const, title: source.title,
      locator: { url: source.url }, metadata: { author: source.author, accessedAt: source.accessedAt, usage: source.usage } }))
  ];
  const blocks = a.blocks.map(block => ({ id: block.id, type: block.type, schemaVersion: 1, conceptIds: block.conceptIds,
    payload: { ...(block.type === "concept" ? { conceptId: block.conceptIds[0] } : {}), ...(block.title ? { title: block.title } : {}), content: block.content } }));
  const questions = a.questions.map(q => {
    const correct = q.choices.filter(choice => choice.correct);
    if (correct.length !== 1) throw new Error(`Question ${q.id} needs exactly one correct choice`);
    return questionSchema.parse({
      id: q.id, version: 1, subjectCode: a.subject, primaryConceptId: q.conceptIds[0], conceptIds: q.conceptIds, type: "multiple_choice", difficulty: q.difficulty,
      cognitiveOperations: [...operations[q.difficulty]],
      // The runtime renders the stem; the stimulus leads it, separated by a blank line.
      stem: q.stimulus ? `${q.stimulus}\n\n${q.stem}` : q.stem,
      choices: q.choices.map(choice => ({ id: choice.id, content: choice.content, correct: choice.correct,
        ...(choice.targetsError ? { targetsError: targetErrors.has(choice.targetsError) ? choice.targetsError : "unknown" } : {}),
        ...(choice.rationale ? { rationale: choice.rationale } : {}) })),
      answer: { kind: "multiple_choice", choiceId: correct[0].id }, explanation: q.explanation, sourceIds: [studioSourceId],
      provenance: { type: "generated", generationRunId: input.generationRunId }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "draft"
    });
  });
  const exit = new Set(a.exitTicketQuestionIds), checkpoints = new Set<string>();
  const activities = a.questions.map((q, index) => {
    const phase = exit.has(q.id) ? "exit_ticket" : q.difficulty === "foundation" ? "guided_practice" : q.difficulty === "ifsc" ? "transfer" : "independent_practice";
    const checkpoint = phase === "guided_practice" ? blocks.find(block => block.type === "concept" && block.conceptIds.includes(q.conceptIds[0]) && !checkpoints.has(block.id))?.id : undefined;
    if (checkpoint) checkpoints.add(checkpoint);
    return { id: `${a.lessonId}-ACT-${String(index + 1).padStart(2, "0")}`, type: "question" as const, conceptIds: q.conceptIds, prompt: prompts[phase], questionId: q.id,
      config: { questionVersion: 1, phase, hints: [], ...(checkpoint ? { checkpointFor: checkpoint } : {}) } };
  });
  const pack = newLessonPackSchema.parse({
    schema: "caderno.lesson-new.v1", packId: input.packId ?? `estudisc.new-lesson.${a.lessonId.toLowerCase()}`, version: input.version ?? 1, authorId: input.authorId,
    target: { trackId: input.context.track.id, trackVersion: input.context.version, moduleId: moduleRecord.id },
    lesson: { id: a.lessonId, version: 1, title: a.title, kind: "core", estimatedMinutes: a.estimatedMinutes, status: "draft",
      concepts: a.concepts.map(concept => ({ id: concept.id, title: concept.title, ...(concept.summary ? { summary: concept.summary } : {}) })),
      prerequisiteConceptIds: input.prerequisiteConceptIds ?? [], objectives: a.objectives, sourceIds: sources.map(source => source.id), exitTicketQuestionIds: a.exitTicketQuestionIds,
      blocks, activities },
    questions, sources
  });
  resolveNewLessonContext([input.context], pack);
  return pack;
}
