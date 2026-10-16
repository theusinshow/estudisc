import { hashCanonicalJson } from "@/lib/canonical-json";
import { codeBlockSchema,conceptBlockSchema,figureBlockSchema,textBlockSchema,titledTextBlockSchema } from "@/features/lessons/blocks/block-schemas";
import { validateSourceGoalPrediction } from "./source-goal-prediction";
import { trackPackV2Schema, type TrackPackV2 } from "./track-pack-v2-schema";
import { validateTrackPackV2Semantics } from "./track-pack-v2-validation";
import { lessonVersionPackSchema, LessonVersionConflictError, type LessonVersionPack, type LessonVersionRepository } from "./lesson-version-contracts";

export function resolveLessonVersionContext(manifests: readonly unknown[], pack: LessonVersionPack) {
  // Caller supplies newest-first actual imported contexts, never a client-provided source snapshot.
  const context = manifests.flatMap(input => { const parsed = trackPackV2Schema.safeParse(input); return parsed.success ? [parsed.data] : []; })
    .find(source => source.track.id === pack.target.trackId && source.version === pack.target.trackVersion);
  if (!context) throw new LessonVersionConflictError("Target Track version has no imported v2 context");
  const moduleRecord = context.track.modules.find(m => m.id === pack.target.moduleId);
  const base = moduleRecord?.lessons.find(l => l.id === pack.target.lessonId);
  if (!base || base.version !== pack.target.baseVersion || hashCanonicalJson(base) !== pack.target.baseHash) throw new LessonVersionConflictError("Source lesson/version/hash changed");
  if (pack.lesson.id !== base.id || pack.lesson.version !== base.version + 1 || pack.lesson.status !== "draft") throw new LessonVersionConflictError("Append the next source lesson version as draft");
  const changes = new Map((pack.corrections?.blocks ?? []).map(change => [change.blockId, change]));
  if (pack.corrections && changes.size !== pack.corrections.blocks.length) throw new LessonVersionConflictError("Each corrected block is listed once");
  for (const change of changes.values()) {
    const old = base.blocks.find(block => block.id === change.blockId), next = pack.lesson.blocks.find(block => block.id === change.blockId);
    if (!old || hashCanonicalJson(old) !== change.baseBlockHash) throw new LessonVersionConflictError("Correction target block changed or is missing");
    if (change.action === "remove" && next) throw new LessonVersionConflictError("Removed block is still present");
    if (change.action === "replace") {
      if (!next) throw new LessonVersionConflictError("Replaced block is missing");
      if (next.type !== old.type) throw new LessonVersionConflictError("A corrected block must keep its block type");
      if (hashCanonicalJson(next) === hashCanonicalJson(old)) throw new LessonVersionConflictError("Correction does not change the block");
      if (hashCanonicalJson(next.conceptIds) !== hashCanonicalJson(old.conceptIds)) throw new LessonVersionConflictError("A corrected block must keep its Concepts");
      // A corrected figure may only change its text (caption, credit, descriptions); its image stays the same.
      if (next.type === "figure") {
        if (next.payload.src !== old.payload.src || !figureBlockSchema.safeParse({ ...next.payload, type: next.type }).success) throw new LessonVersionConflictError("A corrected figure must keep its image and stay valid");
      } else validateTextBlock(next, base, false);
    }
  }
  const retained = pack.lesson.blocks.filter(b => base.blocks.some(old => old.id === b.id));
  const expected = base.blocks.filter(b => changes.get(b.id)?.action !== "remove").map(b => changes.get(b.id)?.action === "replace" ? pack.lesson.blocks.find(next => next.id === b.id)! : b);
  if (hashCanonicalJson(retained) !== hashCanonicalJson(expected) || hashCanonicalJson({ ...pack.lesson, blocks: base.blocks, activities: base.activities, version: base.version, status: base.status }) !== hashCanonicalJson(base)) throw new LessonVersionConflictError("Retained blocks and lesson fields must match the source, except declared corrections");
  if (!pack.corrections && !pack.questionVersions?.length && pack.lesson.blocks.length <= base.blocks.length) throw new LessonVersionConflictError("Enrichment must add at least one block");
  const additions = pack.lesson.blocks.filter(b => !base.blocks.some(old => old.id === b.id));
  for (const block of additions) validateTextBlock(block, base, true);
  const newQuestions = validateQuestionVersions(context, base, pack);
  validateActivities(base, pack, newQuestions);
  const refs = [...new Set([...pack.lesson.exitTicketQuestionIds, ...pack.lesson.activities.flatMap(a => a.questionId ? [a.questionId] : [])])];
  if (pack.questionReferences.length !== refs.length || new Set(pack.questionReferences.map(r => r.id)).size !== refs.length) throw new LessonVersionConflictError("Exact unique source Question references required");
  for (const id of refs) {
    const question = newQuestions.get(id) ?? context.questions.find(q => q.id === id), ref = pack.questionReferences.find(r => r.id === id);
    if (!question || !ref || question.version !== ref.version || hashCanonicalJson(question) !== ref.hash) throw new LessonVersionConflictError("Immutable Question reference/hash changed");
  }
  for (const id of newQuestions.keys()) if (!refs.includes(id)) throw new LessonVersionConflictError(`Question version ${id} is unused by the lesson`);
  const projection = structuredClone(context);
  projection.packId = pack.packId;
  projection.track.modules.find(m => m.id === pack.target.moduleId)!.lessons.splice(moduleRecord!.lessons.indexOf(base), 1, structuredClone(pack.lesson));
  // One version per Question id in a snapshot: a lesson-owned Question is replaced by its next version.
  projection.questions = [...projection.questions.filter(q => !newQuestions.has(q.id)), ...structuredClone([...newQuestions.values()])];
  projection.track.metadata = { ...projection.track.metadata, lessonVersionImport: { packet: pack, sourceManifestHash: hashCanonicalJson(context) } };
  const issues = validateTrackPackV2Semantics(projection);
  if (issues.length) throw new LessonVersionConflictError(`Invalid enriched context: ${issues[0].path}: ${issues[0].message}`);
  return { context, base, projection };
}
export function targetedResult(pack: LessonVersionPack, status: "ready" | "imported" | "already_imported") {
  return { status, packId: pack.packId, version: pack.version, trackId: pack.target.trackId, lessonId: pack.lesson.id, lessonVersion: pack.lesson.version };
}
export async function importLessonVersion(input: unknown, repository: LessonVersionRepository, preview = false) {
  const pack = lessonVersionPackSchema.parse(input);
  return repository.executeLessonVersion(pack, hashCanonicalJson(pack), preview);
}
export function isLessonVersionProjection(pack: TrackPackV2) { return pack.track.metadata.lessonVersionImport !== undefined; }

type SourceLesson = ReturnType<typeof resolveLessonVersionContext>["base"];
/** New or corrected blocks: existing source Concepts and an existing non-assessed renderer only. */
function validateTextBlock(block: LessonVersionPack["lesson"]["blocks"][number], base: SourceLesson, isAddition: boolean) {
  if((isAddition&&!block.conceptIds.length)||block.conceptIds.some(id=>!base.concepts.some(c=>c.id===id)))throw new LessonVersionConflictError("New blocks must use existing source Concepts");
  if(block.type==="numeric-explorer")return;
  if(block.type==="prediction"){try{validateSourceGoalPrediction(block,base);}catch(error){throw new LessonVersionConflictError(error instanceof Error?error.message:"Invalid source-goal prediction");}return;}
  if(block.payload.type!==undefined&&block.payload.type!==block.type)throw new LessonVersionConflictError("Block payload type differs from its envelope");
  if(block.type==="concept"&&block.payload.conceptId!==undefined&&!block.conceptIds.includes(String(block.payload.conceptId)))throw new LessonVersionConflictError("Concept payload must match the source-bound block Concepts");
  const schema=block.type==="code"?codeBlockSchema:block.type==="concept"?conceptBlockSchema:block.type==="text"||block.type==="summary"?textBlockSchema:["note","warning","example","worked-example"].includes(block.type)?titledTextBlockSchema:null;
  if(!schema||!schema.safeParse({...block.payload,type:block.type}).success)throw new LessonVersionConflictError("Addition requires an existing non-assessed text renderer; no new media/assessment");
}

type Context = ReturnType<typeof resolveLessonVersionContext>["context"];
type ContextQuestion = Context["questions"][number];
const questionIdsOf = (lesson: { exitTicketQuestionIds: string[]; activities: { questionId?: string }[] }) => new Set([...lesson.exitTicketQuestionIds, ...lesson.activities.flatMap(a => a.questionId ? [a.questionId] : [])]);

/** ADR 0063: new versions only for lesson-owned Questions, new Questions only with unused ids; all draft, non-official, unreserved. */
function validateQuestionVersions(context: Context, base: SourceLesson, pack: LessonVersionPack) {
  const result = new Map<string, ContextQuestion>();
  const owned = questionIdsOf(base);
  const elsewhere = new Set(context.track.modules.flatMap(m => m.lessons.filter(l => l.id !== base.id).flatMap(l => [...questionIdsOf(l)])));
  const concepts = new Set(base.concepts.map(c => c.id));
  for (const question of pack.questionVersions ?? []) {
    if (result.has(question.id)) throw new LessonVersionConflictError(`Question ${question.id} listed twice`);
    const current = context.questions.find(q => q.id === question.id);
    if (current) {
      if (!owned.has(question.id)) throw new LessonVersionConflictError(`Question ${question.id} is not referenced by this lesson`);
      if (elsewhere.has(question.id)) throw new LessonVersionConflictError(`Question ${question.id} is referenced by another lesson`);
      if (question.version !== current.version + 1) throw new LessonVersionConflictError(`Question ${question.id} must be the next version`);
    } else if (question.version !== 1) throw new LessonVersionConflictError(`New Question ${question.id} must start at version 1`);
    if (question.status !== "draft") throw new LessonVersionConflictError(`Question ${question.id} must be a draft`);
    if (question.provenance.type === "official_exam") throw new LessonVersionConflictError(`Official Question ${question.id} cannot enter through a lesson version`);
    if (question.exposurePolicy.reservedForAssessment) throw new LessonVersionConflictError(`Question ${question.id} is reserved for assessment`);
    if (question.conceptIds.some(id => !concepts.has(id))) throw new LessonVersionConflictError(`Question ${question.id} uses a Concept outside the lesson`);
    result.set(question.id, question as ContextQuestion);
  }
  return result;
}

/** Activities stay as published except rebinding to the next version of their own Question, or appended question Activities for new Questions. */
function validateActivities(base: SourceLesson, pack: LessonVersionPack, questions: ReadonlyMap<string, ContextQuestion>) {
  const next = pack.lesson.activities;
  if (next.length < base.activities.length) throw new LessonVersionConflictError("Activities cannot be removed");
  const bound = new Set<string>();
  base.activities.forEach((old, index) => {
    const activity = next[index];
    const { config: oldConfig, ...oldRest } = old, { config: newConfig, ...newRest } = activity;
    if (hashCanonicalJson(oldRest) !== hashCanonicalJson(newRest)) throw new LessonVersionConflictError("Activities may only rebind their Question version");
    const oldVersion = (oldConfig as { questionVersion?: number }).questionVersion, newVersion = (newConfig as { questionVersion?: number }).questionVersion;
    if (hashCanonicalJson({ ...oldConfig, questionVersion: null }) !== hashCanonicalJson({ ...newConfig, questionVersion: null })) throw new LessonVersionConflictError("Activities may only rebind their Question version");
    if (oldVersion === newVersion) return;
    const question = activity.questionId ? questions.get(activity.questionId) : undefined;
    if (!question || question.version !== newVersion) throw new LessonVersionConflictError(`Activity ${activity.id} is not bound to a listed Question version`);
    bound.add(question.id);
  });
  for (const activity of next.slice(base.activities.length)) {
    const question = activity.questionId ? questions.get(activity.questionId) : undefined;
    if (activity.type !== "question" || !question || question.version !== 1 || (activity.config as { questionVersion?: number }).questionVersion !== 1) throw new LessonVersionConflictError("Appended Activities must ask a new Question");
    if (base.activities.some(old => old.id === activity.id) || next.filter(other => other.id === activity.id).length > 1) throw new LessonVersionConflictError(`Activity ${activity.id} is not unique`);
    bound.add(question.id);
  }
  for (const id of questions.keys()) if (!bound.has(id) && !pack.lesson.exitTicketQuestionIds.includes(id)) throw new LessonVersionConflictError(`Question version ${id} is not bound to an Activity`);
}
