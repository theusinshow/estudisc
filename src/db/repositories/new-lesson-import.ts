import { and, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";
import { activities, concepts, contentBlocks, contentReleases, lessonConcepts, lessons, modules, packImports, questions, tracks } from "@/db/schema";
import { LessonVersionConflictError } from "@/features/import/application/lesson-version-contracts";
import type { NewLessonPack } from "@/features/import/application/new-lesson-contracts";
import { newLessonResult, resolveNewLessonContext } from "@/features/import/application/new-lesson-policy";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { DrizzleCurriculumRepository } from "./curriculum-repository";
import { loadTrackContext } from "./lesson-version-import";
import { DrizzleQuestionRepository } from "./question-repository";
type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** ADR 0064: appends one new draft lesson with its new Concepts, Questions and sources to an imported Track version. */
export async function executeNewLesson(db: Database, actorId: string, pack: NewLessonPack, contentHash: string, preview: boolean) {
  return db.transaction(async tx => {
    const receipt = async () => {
      const [row] = await tx.select().from(packImports).where(and(eq(packImports.packId, pack.packId), eq(packImports.version, pack.version)));
      if (!row) return false;
      if (row.contentHash !== contentHash || row.schema !== pack.schema) throw new LessonVersionConflictError("Pack receipt already exists with different content/schema");
      return true;
    };
    if (await receipt()) return newLessonResult(pack, "already_imported");
    const query = tx.select().from(tracks).where(and(eq(tracks.stableId, pack.target.trackId), eq(tracks.contentVersion, pack.target.trackVersion)));
    const [track] = preview ? await query : await query.for("update");
    if (!track) throw new LessonVersionConflictError("Target Track not found");
    if (await receipt()) return newLessonResult(pack, "already_imported");
    const { module, projection } = resolveNewLessonContext(await loadTrackContext(tx, pack.target.trackId, pack.target.trackVersion), pack);
    const [moduleRow] = await tx.select().from(modules).where(and(eq(modules.trackId, track.id), eq(modules.stableId, module.id)));
    if (!moduleRow) throw new LessonVersionConflictError("Target module not found");
    const lesson = pack.lesson;
    // Stable ids are global: a lesson, Concept or Question id stored anywhere (any Track) is never reused.
    if ((await tx.select({ id: lessons.id }).from(lessons).where(eq(lessons.stableId, lesson.id))).length) throw new LessonVersionConflictError(`Lesson ${lesson.id} already exists`);
    if ((await tx.select({ id: concepts.id }).from(concepts).where(inArray(concepts.stableId, lesson.concepts.map(c => c.id)))).length) throw new LessonVersionConflictError("A new Concept id already exists");
    if ((await tx.select({ id: questions.id }).from(questions).where(inArray(questions.stableId, pack.questions.map(q => q.id)))).length) throw new LessonVersionConflictError("A new Question id already exists");
    const [evaluator] = await tx.select({ version: activities.evaluatorVersion }).from(activities).innerJoin(lessons, eq(lessons.id, activities.lessonId))
      .innerJoin(modules, eq(modules.id, lessons.moduleId)).where(and(eq(modules.trackId, track.id), eq(activities.type, "question"))).limit(1);
    if (!evaluator) throw new LessonVersionConflictError("No question evaluator to reuse in this Track");
    const [last] = await tx.select({ order: sql<number | null>`max(${lessons.orderIndex})` }).from(lessons).where(eq(lessons.moduleId, moduleRow.id));
    if (preview) return newLessonResult(pack, "ready");
    // Track lock serializes its snapshots; timestamp is assigned after locking, not at transaction start.
    const [created] = await tx.insert(packImports).values({ schema: pack.schema, packId: pack.packId, version: pack.version, contentHash, status: "applied", manifest: projection,
      importedAt: sql`greatest(clock_timestamp(), (select max(imported_at) from pack_imports) + interval '1 microsecond')` }).onConflictDoNothing().returning();
    if (!created) { if (await receipt()) return newLessonResult(pack, "already_imported"); throw new LessonVersionConflictError("Pack receipt race"); }
    const [row] = await tx.insert(lessons).values({ stableId: lesson.id, moduleId: moduleRow.id, title: lesson.title, contentVersion: lesson.version, orderIndex: Number(last?.order ?? -1) + 1,
      metadata: { kind: lesson.kind, estimatedMinutes: lesson.estimatedMinutes, status: "draft", objectives: lesson.objectives, sourceIds: lesson.sourceIds, prerequisiteConceptIds: lesson.prerequisiteConceptIds, exitTicketQuestionIds: lesson.exitTicketQuestionIds, newLessonPackImportId: created.id, importedBy: actorId } }).returning();
    for (const concept of lesson.concepts) {
      const [conceptRow] = await tx.insert(concepts).values({ stableId: concept.id, title: concept.title, summary: concept.summary }).returning({ id: concepts.id });
      await tx.insert(lessonConcepts).values({ lessonId: row.id, conceptId: conceptRow.id });
    }
    // Sources and Track Concept settings go through the curriculum foundation; no requirement mapping is invented.
    await new DrizzleCurriculumRepository(tx as never).applyFoundation(track.id, { sources: pack.sources, requirements: [], prerequisites: [],
      settings: lesson.concepts.map(concept => ({ conceptId: concept.id, moduleId: module.id, subjectCode: module.subjectCode, importance: concept.importance })) });
    await new DrizzleQuestionRepository(tx as never).importVersions(track.id, pack.questions);
    for (const [index, block] of lesson.blocks.entries()) await tx.insert(contentBlocks).values({ stableId: block.id, lessonId: row.id, type: block.type, orderIndex: index, payload: { ...block.payload, ...block } });
    for (const [index, activity] of lesson.activities.entries()) await tx.insert(activities).values({ stableId: activity.id, lessonId: row.id, type: activity.type, prompt: activity.prompt, orderIndex: index,
      evaluatorVersion: evaluator.version, config: JSON.parse(JSON.stringify({ ...activity.config, ...activity, questionVersion: 1 })) });
    for (const question of pack.questions) await tx.insert(contentReleases).values({ targetType: "question", stableId: question.id, version: question.version, contentHash: hashCanonicalJson(question), authorId: pack.authorId });
    await tx.insert(contentReleases).values({ targetType: "lesson", stableId: lesson.id, version: lesson.version, contentHash: hashCanonicalJson(lesson), authorId: pack.authorId });
    return newLessonResult(pack, "imported");
  }).catch(error => {
    const cause = (error as { cause?: { code?: string }; code?: string }).cause ?? error as { code?: string };
    if (cause.code === "23505") throw new LessonVersionConflictError("Conflicting persisted Pack/content version");
    throw error;
  });
}
