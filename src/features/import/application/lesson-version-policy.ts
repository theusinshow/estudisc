import { hashCanonicalJson } from "@/lib/canonical-json";
import { codeBlockSchema,conceptBlockSchema,textBlockSchema,titledTextBlockSchema } from "@/features/lessons/blocks/block-schemas";
import { validateSourceGoalPrediction } from "./source-goal-prediction";
import { trackPackV2Schema, type TrackPackV2 } from "./track-pack-v2-schema";
import { validateTrackPackV2Semantics } from "./track-pack-v2-validation";
import { assessedLessonVersionPackSchema, lessonVersionPacketSchema, lessonVersionPackSchema, LessonVersionConflictError, type AssessedLessonVersionPack, type LessonVersionPack, type LessonVersionPacket, type LessonVersionRepository } from "./lesson-version-contracts";

export function resolveLessonVersionContext(manifests: readonly unknown[], pack: LessonVersionPack) {
  // Caller supplies newest-first actual imported contexts, never a client-provided source snapshot.
  const context = manifests.flatMap(input => { const parsed = trackPackV2Schema.safeParse(input); return parsed.success ? [parsed.data] : []; })
    .find(source => source.track.id === pack.target.trackId && source.version === pack.target.trackVersion);
  if (!context) throw new LessonVersionConflictError("Target Track version has no imported v2 context");
  const moduleRecord = context.track.modules.find(m => m.id === pack.target.moduleId);
  const base = moduleRecord?.lessons.find(l => l.id === pack.target.lessonId);
  if (!base || base.version !== pack.target.baseVersion || hashCanonicalJson(base) !== pack.target.baseHash) throw new LessonVersionConflictError("Source lesson/version/hash changed");
  if (pack.lesson.id !== base.id || pack.lesson.version !== base.version + 1 || pack.lesson.status !== "draft") throw new LessonVersionConflictError("Append the next source lesson version as draft");
  const retained = pack.lesson.blocks.filter(b => base.blocks.some(old => old.id === b.id));
  if (hashCanonicalJson(retained) !== hashCanonicalJson(base.blocks) || hashCanonicalJson({ ...pack.lesson, blocks: base.blocks, version: base.version, status: base.status }) !== hashCanonicalJson(base)) throw new LessonVersionConflictError("Source fields/blocks/Activities/Concepts cannot be changed by enrichment");
  if (pack.lesson.blocks.length <= base.blocks.length) throw new LessonVersionConflictError("Enrichment must add at least one block");
  const additions = pack.lesson.blocks.filter(b => !base.blocks.some(old => old.id === b.id));
  for(const block of additions){
    if(!block.conceptIds.length||block.conceptIds.some(id=>!base.concepts.some(c=>c.id===id)))throw new LessonVersionConflictError("New blocks must use existing source Concepts");
    if(block.type==="numeric-explorer")continue;
    if(block.type==="prediction"){try{validateSourceGoalPrediction(block,base);}catch(error){throw new LessonVersionConflictError(error instanceof Error?error.message:"Invalid source-goal prediction");}continue;}
    if(block.payload.type!==undefined&&block.payload.type!==block.type)throw new LessonVersionConflictError("Block payload type differs from its envelope");
    if(block.type==="concept"&&block.payload.conceptId!==undefined&&!block.conceptIds.includes(String(block.payload.conceptId)))throw new LessonVersionConflictError("Concept payload must match the source-bound block Concepts");
    const schema=block.type==="code"?codeBlockSchema:block.type==="concept"?conceptBlockSchema:block.type==="text"||block.type==="summary"?textBlockSchema:["note","warning","example","worked-example"].includes(block.type)?titledTextBlockSchema:null;
    if(!schema||!schema.safeParse({...block.payload,type:block.type}).success)throw new LessonVersionConflictError("Addition requires an existing non-assessed text renderer; no new media/assessment");
  }
  const refs = [...new Set([...base.exitTicketQuestionIds, ...base.activities.flatMap(a => a.questionId ? [a.questionId] : [])])];
  if (pack.questionReferences.length !== refs.length || new Set(pack.questionReferences.map(r => r.id)).size !== refs.length) throw new LessonVersionConflictError("Exact unique source Question references required");
  for (const id of refs) {
    const question = context.questions.find(q => q.id === id), ref = pack.questionReferences.find(r => r.id === id);
    if (!question || !ref || question.version !== ref.version || hashCanonicalJson(question) !== ref.hash) throw new LessonVersionConflictError("Immutable Question reference/hash changed");
  }
  const projection = structuredClone(context);
  projection.packId = pack.packId;
  projection.track.modules.find(m => m.id === pack.target.moduleId)!.lessons.splice(moduleRecord!.lessons.indexOf(base), 1, structuredClone(pack.lesson));
  projection.track.metadata = { ...projection.track.metadata, lessonVersionImport: { packet: pack, sourceManifestHash: hashCanonicalJson(context) } };
  const issues = validateTrackPackV2Semantics(projection);
  if (issues.length) throw new LessonVersionConflictError(`Invalid enriched context: ${issues[0].path}: ${issues[0].message}`);
  return { context, base, projection };
}
export function resolveAssessedLessonVersionContext(manifests: readonly unknown[], input: AssessedLessonVersionPack) {
  const pack = assessedLessonVersionPackSchema.parse(input);
  const context = manifests.flatMap(input => { const parsed = trackPackV2Schema.safeParse(input); return parsed.success ? [parsed.data] : []; })
    .find(source => source.track.id === pack.target.trackId && source.version === pack.target.trackVersion);
  if (!context) throw new LessonVersionConflictError("Target Track version has no imported v2 context");
  const moduleRecord = context.track.modules.find(m => m.id === pack.target.moduleId);
  const base = moduleRecord?.lessons.find(l => l.id === pack.target.lessonId);
  if (!base || base.version !== pack.target.baseVersion || hashCanonicalJson(base) !== pack.target.baseHash) throw new LessonVersionConflictError("Source lesson/version/hash changed");
  if (pack.lesson.id !== base.id || pack.lesson.version !== base.version + 1 || pack.lesson.status !== "draft") throw new LessonVersionConflictError("Append the next source lesson version as draft");
  const retainedBlocks = pack.lesson.blocks.filter(block => base.blocks.some(old => old.id === block.id));
  if (hashCanonicalJson(retainedBlocks) !== hashCanonicalJson(base.blocks)) throw new LessonVersionConflictError("Source blocks cannot be changed by assessed enrichment");
  const retainedActivities = pack.lesson.activities.slice(0, base.activities.length);
  if (hashCanonicalJson(retainedActivities) !== hashCanonicalJson(base.activities)) throw new LessonVersionConflictError("Source Activities cannot be changed by assessed enrichment");
  if (hashCanonicalJson({ ...pack.lesson, blocks: base.blocks, activities: base.activities, version: base.version, status: base.status }) !== hashCanonicalJson(base)) throw new LessonVersionConflictError("Source fields, Concepts and Question bindings cannot be changed by assessed enrichment");
  const blocks = pack.lesson.blocks.filter(block => !base.blocks.some(old => old.id === block.id));
  if (blocks.length) {
    const v2Input: Record<string, unknown> = { ...pack, schema: "caderno.lesson.v2" }; delete v2Input.newQuestions;
    const v2 = lessonVersionPackSchema.parse({ ...v2Input, questionReferences: pack.questionReferences.filter(ref => !pack.newQuestions.some(question => question.id === ref.id)) });
    resolveLessonVersionContext(manifests, { ...v2, lesson: { ...v2.lesson, activities: base.activities } });
  }
  const baseRefs = [...new Set([...base.exitTicketQuestionIds, ...base.activities.flatMap(activity => activity.questionId ? [activity.questionId] : [])])];
  const baseRefMap = new Map(baseRefs.map(questionId => [questionId, context.questions.find(question => question.id === questionId)]));
  const newIds = new Set(pack.newQuestions.map(question => question.id));
  if (newIds.size !== pack.newQuestions.length || [...newIds].some(id => context.questions.some(question => question.id === id))) throw new LessonVersionConflictError("New Question IDs must be unique and absent from the source context");
  for (const question of pack.newQuestions) {
    if (question.version !== 1 || question.status !== "draft" || !["generated", "human_created"].includes(question.provenance.type) || question.provenance.type === "generated" && !question.provenance.generationRunId || question.exposurePolicy.reservedForAssessment || question.assets.length) throw new LessonVersionConflictError("Assessed append permits only truthfully-provenanced draft training Questions without assets");
    if (question.conceptIds.some(id => !base.concepts.some(concept => concept.id === id)) || question.sourceIds.some(id => !context.sources.some(source => source.id === id))) throw new LessonVersionConflictError("New Question Concepts and sources must belong to the retained lesson context");
  }
  if (pack.questionReferences.length !== baseRefs.length + pack.newQuestions.length || new Set(pack.questionReferences.map(ref => ref.id)).size !== pack.questionReferences.length) throw new LessonVersionConflictError("Exact retained and appended Question references required");
  for (const [id, question] of baseRefMap) {
    const ref = pack.questionReferences.find(candidate => candidate.id === id);
    if (!question || !ref || question.version !== ref.version || hashCanonicalJson(question) !== ref.hash) throw new LessonVersionConflictError("Immutable source Question reference/hash changed");
  }
  for (const question of pack.newQuestions) {
    const ref = pack.questionReferences.find(candidate => candidate.id === question.id);
    if (!ref || ref.version !== question.version || ref.hash !== hashCanonicalJson(question)) throw new LessonVersionConflictError("New Question reference/hash differs from its immutable content");
  }
  const appendedActivities = pack.lesson.activities.slice(base.activities.length);
  if (appendedActivities.length !== pack.newQuestions.length || new Set(appendedActivities.map(activity => activity.id)).size !== appendedActivities.length || new Set(appendedActivities.map(activity => activity.questionId)).size !== pack.newQuestions.length) throw new LessonVersionConflictError("Each appended Question requires one new Activity binding");
  for (const activity of appendedActivities) {
    const question = pack.newQuestions.find(candidate => candidate.id === activity.questionId);
    if (activity.type !== "question" || !question || activity.conceptIds.some(id => !base.concepts.some(concept => concept.id === id))) throw new LessonVersionConflictError("Only retained-Concept question Activities may be appended");
    if (activity.config.questionId !== undefined || activity.config.questionVersion !== undefined || activity.evaluatorVersion !== undefined) throw new LessonVersionConflictError("Question Activity identity/version/evaluator belongs to the immutable binding, not config");
  }
  const projection = structuredClone(context);
  projection.questions.push(...structuredClone(pack.newQuestions));
  projection.track.modules.find(module => module.id === pack.target.moduleId)!.lessons.splice(moduleRecord!.lessons.indexOf(base), 1, structuredClone(pack.lesson));
  projection.track.metadata = { ...projection.track.metadata, lessonVersionImport: { packet: pack, sourceManifestHash: hashCanonicalJson(context) } };
  const issues = validateTrackPackV2Semantics(projection);
  if (issues.length) throw new LessonVersionConflictError(`Invalid assessed enrichment context: ${issues[0].path}: ${issues[0].message}`);
  return { context, base, projection, baseQuestionReferences: baseRefs };
}
export function targetedResult(pack: LessonVersionPacket, status: "ready" | "imported" | "already_imported") {
  return { status, packId: pack.packId, version: pack.version, trackId: pack.target.trackId, lessonId: pack.lesson.id, lessonVersion: pack.lesson.version };
}
export async function importLessonVersion(input: unknown, repository: LessonVersionRepository, preview = false) {
  const pack = lessonVersionPacketSchema.parse(input);
  return repository.executeLessonVersion(pack, hashCanonicalJson(pack), preview);
}
export function isLessonVersionProjection(pack: TrackPackV2) { return pack.track.metadata.lessonVersionImport !== undefined; }
