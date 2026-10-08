import { hashCanonicalJson } from "@/lib/canonical-json";
import { codeBlockSchema,conceptBlockSchema,textBlockSchema,titledTextBlockSchema } from "@/features/lessons/blocks/block-schemas";
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
  const retained = pack.lesson.blocks.filter(b => base.blocks.some(old => old.id === b.id));
  if (hashCanonicalJson(retained) !== hashCanonicalJson(base.blocks) || hashCanonicalJson({ ...pack.lesson, blocks: base.blocks, version: base.version, status: base.status }) !== hashCanonicalJson(base)) throw new LessonVersionConflictError("Source fields/blocks/Activities/Concepts cannot be changed by enrichment");
  if (pack.lesson.blocks.length <= base.blocks.length) throw new LessonVersionConflictError("Enrichment must add at least one block");
  const additions = pack.lesson.blocks.filter(b => !base.blocks.some(old => old.id === b.id));
  for(const block of additions){
    if(!block.conceptIds.length||block.conceptIds.some(id=>!base.concepts.some(c=>c.id===id)))throw new LessonVersionConflictError("New blocks must use existing source Concepts");
    if(block.type==="numeric-explorer")continue;
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
export function targetedResult(pack: LessonVersionPack, status: "ready" | "imported" | "already_imported") {
  return { status, packId: pack.packId, version: pack.version, trackId: pack.target.trackId, lessonId: pack.lesson.id, lessonVersion: pack.lesson.version };
}
export async function importLessonVersion(input: unknown, repository: LessonVersionRepository, preview = false) {
  const pack = lessonVersionPackSchema.parse(input);
  return repository.executeLessonVersion(pack, hashCanonicalJson(pack), preview);
}
export function isLessonVersionProjection(pack: TrackPackV2) { return pack.track.metadata.lessonVersionImport !== undefined; }
