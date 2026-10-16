import { hashCanonicalJson } from "@/lib/canonical-json";
import { LessonVersionConflictError } from "./lesson-version-contracts";
import { validateTextBlock } from "./lesson-version-policy";
import { newLessonPackSchema, type NewLessonPack, type NewLessonRepository } from "./new-lesson-contracts";
import { trackPackV2Schema } from "./track-pack-v2-schema";
import { validateTrackPackV2Semantics } from "./track-pack-v2-validation";

/** Existing non-assessed text renderers only (ADR 0064); no media, prediction, explorer or assessment blocks. */
export const NEW_LESSON_BLOCK_TYPES = new Set(["text", "concept", "note", "worked-example", "warning", "summary", "example"]);
const fail = (message: string): never => { throw new LessonVersionConflictError(message); };

/**
 * ADR 0064: validates one new lesson against the newest imported context of the target Track version and returns
 * the snapshot projection (context + appended lesson + its new Questions and sources). Callers supply newest-first
 * actually imported manifests, never a client-provided snapshot.
 */
export function resolveNewLessonContext(manifests: readonly unknown[], pack: NewLessonPack) {
  const context = manifests.flatMap(input => { const parsed = trackPackV2Schema.safeParse(input); return parsed.success ? [parsed.data] : []; })
    .find(source => source.track.id === pack.target.trackId && source.version === pack.target.trackVersion);
  if (!context) fail("Target Track version has no imported v2 context");
  const track = context!.track, lesson = pack.lesson;
  const moduleRecord = track.modules.find(m => m.id === pack.target.moduleId);
  if (!moduleRecord) fail("Target module is not part of the Track context");
  const lessonsInContext = track.modules.flatMap(m => m.lessons);
  if (lessonsInContext.some(l => l.id === lesson.id)) fail(`Lesson ${lesson.id} already exists in the Track context`);
  if (lesson.version !== 1 || lesson.status !== "draft") fail("A new lesson starts at version 1 as draft");
  if (!lesson.objectives.length || !lesson.exitTicketQuestionIds.length) fail("A new lesson needs objectives and an exit ticket");
  const contextConcepts = new Set(lessonsInContext.flatMap(l => l.concepts.map(c => c.id)));
  for (const concept of lesson.concepts) if (contextConcepts.has(concept.id)) fail(`Concept ${concept.id} already exists; a new lesson only creates new Concepts`);
  for (const id of lesson.prerequisiteConceptIds) if (!contextConcepts.has(id)) fail(`Prerequisite Concept ${id} is not part of the Track context`);
  if (!lesson.blocks.length) fail("A new lesson needs blocks");
  for (const block of lesson.blocks) {
    if (!NEW_LESSON_BLOCK_TYPES.has(block.type)) fail(`Block ${block.id} uses ${block.type}; only existing text renderers are allowed`);
    validateTextBlock(block, lesson, true);
  }
  const sourceIds = new Set(context!.sources.map(s => s.id));
  for (const source of pack.sources) { if (sourceIds.has(source.id)) fail(`Source ${source.id} already exists in the Track context`); sourceIds.add(source.id); }
  const contextQuestions = new Set(context!.questions.map(q => q.id)), concepts = new Set(lesson.concepts.map(c => c.id));
  const questions = new Map<string, NewLessonPack["questions"][number]>();
  for (const question of pack.questions) {
    if (questions.has(question.id)) fail(`Question ${question.id} listed twice`);
    if (contextQuestions.has(question.id)) fail(`Question ${question.id} already exists; a new lesson only creates new Questions`);
    if (question.version !== 1 || question.status !== "draft") fail(`New Question ${question.id} must be version 1 as draft`);
    if (question.provenance.type === "official_exam") fail(`Official Question ${question.id} cannot enter through a new lesson`);
    if (question.exposurePolicy.reservedForAssessment) fail(`Question ${question.id} is reserved for assessment`);
    if (question.subjectCode !== moduleRecord!.subjectCode) fail(`Question ${question.id} belongs to another subject`);
    if (question.conceptIds.some(id => !concepts.has(id))) fail(`Question ${question.id} uses a Concept outside the lesson`);
    questions.set(question.id, question);
  }
  const used = new Set(lesson.exitTicketQuestionIds);
  const activityIds = new Set<string>();
  for (const activity of lesson.activities) {
    if (activityIds.has(activity.id)) fail(`Activity ${activity.id} is not unique`);
    activityIds.add(activity.id);
    const question = activity.questionId ? questions.get(activity.questionId) : undefined;
    if (activity.type !== "question" || !question || (activity.config as { questionVersion?: number }).questionVersion !== 1) fail(`Activity ${activity.id} must ask one of the new Questions at version 1`);
    used.add(question!.id);
  }
  for (const id of used) if (!questions.has(id)) fail(`Question ${id} is not one of the new lesson Questions`);
  for (const id of questions.keys()) if (!used.has(id)) fail(`Question ${id} is unused by the lesson`);
  const projection = structuredClone(context!);
  projection.packId = pack.packId;
  projection.track.modules.find(m => m.id === moduleRecord!.id)!.lessons.push(structuredClone(lesson));
  projection.questions.push(...structuredClone(pack.questions));
  projection.sources.push(...structuredClone(pack.sources));
  projection.track.metadata = { ...projection.track.metadata, newLessonImport: { packet: pack, sourceManifestHash: hashCanonicalJson(context) } };
  const issues = validateTrackPackV2Semantics(projection);
  if (issues.length) fail(`Invalid context with the new lesson: ${issues[0].path}: ${issues[0].message}`);
  return { context: context!, module: moduleRecord!, projection };
}

export function newLessonResult(pack: NewLessonPack, status: "ready" | "imported" | "already_imported") {
  return { status, packId: pack.packId, version: pack.version, trackId: pack.target.trackId, moduleId: pack.target.moduleId, lessonId: pack.lesson.id, lessonVersion: pack.lesson.version };
}

export async function importNewLesson(input: unknown, repository: NewLessonRepository, preview = false) {
  const pack = newLessonPackSchema.parse(input);
  return repository.executeNewLesson(pack, hashCanonicalJson(pack), preview);
}
