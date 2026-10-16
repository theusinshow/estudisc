import { z } from "zod";
import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { questionSchema, type Question } from "../../src/features/questions/contracts";
import type { TrackPackV2 } from "../../src/features/import/application/track-pack-v2-schema";
import { lessonVersionPackSchema, type LessonVersionPack } from "../../src/features/import/application/lesson-version-contracts";

type Lesson = TrackPackV2["track"]["modules"][number]["lessons"][number];
const label = z.string().trim().min(1).max(160);

/**
 * One authored interaction (ordering, classification or matching) to append to a published lesson as a new
 * Question (ADR 0063). Labels are plain text; the builder assigns ids. Ordering items are written in the correct order.
 */
export const interactionAuthoringSchema = z.object({
  lessonId: z.string().regex(/^[A-Z]+-[A-Z0-9]+$/),
  type: z.enum(["ordering", "classification", "matching"]),
  conceptId: z.string().min(1),
  difficulty: z.enum(["foundation", "direct", "applied", "ifsc"]),
  stimulus: z.string().trim().min(1).max(700).optional(),
  stem: z.string().trim().min(10).max(300),
  items: z.array(label).min(3).max(8),
  destinations: z.array(label).min(2).max(8).optional(),
  answer: z.record(label, label).optional(),
  explanation: z.string().trim().min(20).max(900)
}).strict().superRefine((value, context) => {
  const fail = (message: string) => context.addIssue({ code: "custom", message });
  if (new Set(value.items).size !== value.items.length) fail("Item labels must be distinct");
  if (value.type === "ordering") {
    if (value.destinations || value.answer) fail("Ordering uses only items, written in the correct order");
    return;
  }
  const destinations = value.destinations ?? [], answer = value.answer ?? {};
  if (new Set(destinations).size !== destinations.length) fail("Destination labels must be distinct");
  if (Object.keys(answer).length !== value.items.length || value.items.some(item => !destinations.includes(answer[item]))) fail("Every item needs exactly one listed destination");
  if (value.type === "matching" && (destinations.length !== value.items.length || new Set(Object.values(answer)).size !== value.items.length)) fail("Matching pairs each item with a different destination");
  if (value.type === "classification" && new Set(Object.values(answer)).size < 2) fail("Classification must use at least two destinations");
});
export type InteractionAuthoring = z.infer<typeof interactionAuthoringSchema>;

const OPERATIONS: Record<InteractionAuthoring["type"], Question["cognitiveOperations"]> = {
  ordering: ["analyze", "apply"], classification: ["identify", "compare"], matching: ["identify", "compare"]
};

/** Deterministic display order that never equals the correct order, so an ordering item is never pre-solved. */
export function scrambledOrder(count: number, seed: string) {
  let state = [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  const next = () => (state = (state * 1103515245 + 12345) >>> 0) / 2 ** 32;
  const order = Array.from({ length: count }, (_, index) => index);
  for (let attempt = 0; attempt < 20 && order.every((value, index) => value === index); attempt++) {
    for (let i = count - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  }
  if (order.every((value, index) => value === index)) order.push(order.shift()!);
  return order;
}

export function buildInteractionQuestion(authored: InteractionAuthoring, options: { questionId: string; subjectCode: string; generationRunId: string }): Question {
  const items = authored.items.map((text, index) => ({ id: `i${index + 1}`, label: text }));
  const itemId = (text: string) => items.find(item => item.label === text)!.id;
  let answer: Question["answer"], destinations: Question["destinations"] = [], displayed = items;
  if (authored.type === "ordering") {
    answer = { kind: "ordering", orderedIds: items.map(item => item.id) };
    displayed = scrambledOrder(items.length, options.questionId).map(index => items[index]);
  } else {
    destinations = (authored.destinations ?? []).map((text, index) => ({ id: `d${index + 1}`, label: text }));
    const destinationId = (text: string) => destinations.find(destination => destination.label === text)!.id;
    const mapping = Object.fromEntries(authored.items.map(text => [itemId(text), destinationId(authored.answer![text])]));
    answer = authored.type === "classification" ? { kind: "classification", assignments: mapping } : { kind: "matching", pairs: mapping };
  }
  return questionSchema.parse({
    id: options.questionId, version: 1, status: "draft", subjectCode: options.subjectCode, type: authored.type,
    primaryConceptId: authored.conceptId, conceptIds: [authored.conceptId], difficulty: authored.difficulty,
    cognitiveOperations: OPERATIONS[authored.type], ...(authored.stimulus ? { stimulus: authored.stimulus } : {}), stem: authored.stem,
    items: displayed, destinations, answer, explanation: authored.explanation, sourceIds: [], assets: [],
    provenance: { type: "generated", generationRunId: options.generationRunId },
    exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }
  });
}

/** Next lesson version that keeps every published block and Activity and appends one question Activity per interaction. */
export function appendInteractions(input: {
  context: TrackPackV2; moduleId: string; base: Lesson; authored: readonly InteractionAuthoring[];
  packId: string; authorId: string; generationRunId: string;
}): LessonVersionPack {
  const { context, base } = input;
  const concepts = new Set(base.concepts.map(concept => concept.id));
  const template = base.activities.find(activity => activity.type === "question" && activity.questionId);
  if (!template) throw new Error(`${base.id} has no question Activity to follow`);
  const subjectCode = context.questions.find(question => question.id === template.questionId)?.subjectCode ?? base.id.split("-")[0];
  const taken = new Set([...context.questions.map(question => question.id), ...base.activities.map(activity => activity.id)]);
  const lesson = structuredClone({ ...base, version: base.version + 1, status: "draft" as const });
  const fresh: Question[] = [];
  input.authored.forEach((authored, index) => {
    if (authored.lessonId !== base.id) throw new Error(`Interaction for ${authored.lessonId} given to ${base.id}`);
    if (!concepts.has(authored.conceptId)) throw new Error(`${authored.conceptId} is not a Concept of ${base.id}`);
    const n = String(index + 1).padStart(2, "0");
    const questionId = `${base.id}-INT-Q${n}`, activityId = `${base.id}-INT-ACT${n}`;
    if (taken.has(questionId) || taken.has(activityId)) throw new Error(`${questionId} or ${activityId} already exists`);
    const question = buildInteractionQuestion(authored, { questionId, subjectCode, generationRunId: input.generationRunId });
    fresh.push(question);
    // The template's hints belong to its own Question; interactions start without hints.
    const config = Object.fromEntries(Object.entries(template.config as Record<string, unknown>).filter(([key]) => key !== "hints"));
    lesson.activities.push({ ...structuredClone(template), id: activityId, questionId, prompt: authored.stem, conceptIds: [authored.conceptId], config: { ...config, questionVersion: 1 } });
  });
  const all = [...context.questions, ...fresh];
  const refs = [...new Set([...lesson.exitTicketQuestionIds, ...lesson.activities.flatMap(activity => activity.questionId ? [activity.questionId] : [])])];
  return lessonVersionPackSchema.parse({
    schema: "caderno.lesson.v2", packId: input.packId, version: 1, authorId: input.authorId,
    target: { trackId: context.track.id, trackVersion: context.version, moduleId: input.moduleId, lessonId: base.id, baseVersion: base.version, baseHash: hashCanonicalJson(base) },
    lesson, questionVersions: fresh,
    questionReferences: refs.map(id => { const question = all.find(entry => entry.id === id)!; return { id, version: question.version, hash: hashCanonicalJson(question) }; })
  });
}
