import { and, desc, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";
import { activities, concepts, contentBlocks, contentReleases, lessonConcepts, lessons, modules, packImports, questionVersions, questions, tracks } from "@/db/schema";
import { resolveLessonVersionContext, targetedResult } from "@/features/import/application/lesson-version-policy";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { LessonVersionConflictError, type LessonVersionPack } from "@/features/import/application/lesson-version-contracts";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { DrizzleQuestionRepository } from "./question-repository";
type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Newest imported v2 snapshot of one Track version (at most one element). Only snapshots of that version qualify;
 * ids are listed newest first and manifests loaded one at a time, because every targeted import adds a snapshot.
 */
export async function loadTrackContext(tx: Database, trackId: string, trackVersion: number) {
  const candidates = await tx.select({ id: packImports.id }).from(packImports)
    .where(sql`${packImports.manifest}->'track'->>'id' = ${trackId} and ${packImports.manifest}->>'version' = ${String(trackVersion)}`)
    .orderBy(desc(packImports.importedAt), desc(packImports.id));
  for (const candidate of candidates) {
    const [row] = await tx.select({ manifest: packImports.manifest }).from(packImports).where(eq(packImports.id, candidate.id));
    if (trackPackV2Schema.safeParse(row?.manifest).success) return [row.manifest] as unknown[];
  }
  return [] as unknown[];
}

export async function executeLessonVersion(db: Database, actorId: string, pack: LessonVersionPack, contentHash: string, preview: boolean) {
  return db.transaction(async tx => {
    const receipt = async () => {
      const [row] = await tx.select().from(packImports).where(and(eq(packImports.packId, pack.packId), eq(packImports.version, pack.version)));
      if (!row) return false;
      if (row.contentHash !== contentHash || row.schema !== pack.schema) throw new LessonVersionConflictError("Pack receipt already exists with different content/schema");
      return true;
    };
    if (await receipt()) return targetedResult(pack, "already_imported");
    const query = tx.select().from(tracks).where(and(eq(tracks.stableId, pack.target.trackId), eq(tracks.contentVersion, pack.target.trackVersion)));
    const [track] = preview ? await query : await query.for("update");
    if (!track) throw new LessonVersionConflictError("Target Track not found");
    if (await receipt()) return targetedResult(pack, "already_imported");
    const contexts = await loadTrackContext(tx, pack.target.trackId, pack.target.trackVersion);
    const { context, base, projection } = resolveLessonVersionContext(contexts, pack);
    const [moduleRow] = await tx.select().from(modules).where(and(eq(modules.trackId, track.id), eq(modules.stableId, pack.target.moduleId)));
    if (!moduleRow) throw new LessonVersionConflictError("Target module not found");
    const [source] = await tx.select().from(lessons).where(and(eq(lessons.moduleId, moduleRow.id), eq(lessons.stableId, base.id), eq(lessons.contentVersion, base.version)));
    const metadata = source?.metadata as { status?: string; qaReleaseId?: string } | undefined;
    if (!source || metadata?.status !== "published" || !metadata.qaReleaseId) throw new LessonVersionConflictError("Base lesson must be published");
    const [baseRelease] = await tx.select().from(contentReleases).where(eq(contentReleases.id, metadata.qaReleaseId));
    if (!baseRelease || baseRelease.targetType !== "lesson" || baseRelease.stableId !== base.id || baseRelease.version !== base.version || baseRelease.status !== "published" || baseRelease.contentHash !== pack.target.baseHash) throw new LessonVersionConflictError("Published base release/hash unavailable");
    const [existing] = await tx.select({ id: lessons.id }).from(lessons).where(and(eq(lessons.stableId, pack.lesson.id), eq(lessons.contentVersion, pack.lesson.version)));
    if (existing) throw new LessonVersionConflictError("Lesson version already exists");
    const newQuestions = new Map((pack.questionVersions ?? []).map(question => [question.id, question]));
    // ADR 0063: listed Question versions are created here; an existing row with other content is a conflict.
    for (const question of newQuestions.values()) {
      const [row] = await tx.select({ hash: questionVersions.contentHash }).from(questionVersions).innerJoin(questions, eq(questions.id, questionVersions.questionId)).where(and(eq(questions.stableId, question.id), eq(questionVersions.version, question.version)));
      if (row && row.hash !== hashCanonicalJson(question)) throw new LessonVersionConflictError(`Question ${question.id} v${question.version} already exists with other content`);
    }
    for (const ref of pack.questionReferences.filter(entry => !newQuestions.has(entry.id))) {
      const [row] = await tx.select({ hash: questionVersions.contentHash, status: questionVersions.status }).from(questionVersions).innerJoin(questions, eq(questions.id, questionVersions.questionId)).where(and(eq(questions.stableId, ref.id), eq(questionVersions.version, ref.version)));
      if (!row || row.hash !== ref.hash || row.status !== "published") throw new LessonVersionConflictError("Existing Question version unavailable or changed");
    }
    const links = await tx.select({ conceptId: lessonConcepts.conceptId, stableId: concepts.stableId }).from(lessonConcepts).innerJoin(concepts, eq(concepts.id, lessonConcepts.conceptId)).where(eq(lessonConcepts.lessonId, source.id));
    if (links.length !== pack.lesson.concepts.length || base.concepts.some(c => !links.some(link => link.stableId === c.id))) throw new LessonVersionConflictError("Source Concept links incomplete");
    const sourceActivities = await tx.select().from(activities).where(eq(activities.lessonId, source.id));
    // The stored rows must still match the published base; the new version may only rebind or append (checked by the policy).
    if (sourceActivities.length !== base.activities.length || base.activities.some(a => !sourceActivities.some(row => row.stableId === a.id && row.type === a.type && row.prompt === a.prompt))) throw new LessonVersionConflictError("Stored source Activities incomplete or changed");
    for (const activity of base.activities) {
      const stored = sourceActivities.find(row => row.stableId === activity.id)!;
      const expected = JSON.parse(JSON.stringify({ ...activity.config, ...activity, questionVersion: activity.questionId ? context.questions.find(question => question.id === activity.questionId)?.version : undefined }));
      if (hashCanonicalJson(stored.config) !== hashCanonicalJson(expected)) throw new LessonVersionConflictError("Stored source Activity config differs from immutable context");
    }
    if (preview) return targetedResult(pack, "ready");
    // Track lock serializes its snapshots; timestamp is assigned after locking, not at transaction start.
    const [created] = await tx.insert(packImports).values({ schema: pack.schema, packId: pack.packId, version: pack.version, contentHash, status: "applied", manifest: projection,
      importedAt: sql`greatest(clock_timestamp(), (select max(imported_at) from pack_imports) + interval '1 microsecond')` }).onConflictDoNothing().returning();
    if (!created) { if (await receipt()) return targetedResult(pack, "already_imported"); throw new LessonVersionConflictError("Pack receipt race"); }
    if (newQuestions.size) {
      await new DrizzleQuestionRepository(tx as never).importVersions(track.id, [...newQuestions.values()]);
      for (const question of newQuestions.values()) await tx.insert(contentReleases).values({ targetType: "question", stableId: question.id, version: question.version, contentHash: hashCanonicalJson(question), authorId: pack.authorId });
    }
    const lesson = pack.lesson;
    const [row] = await tx.insert(lessons).values({ stableId: lesson.id, moduleId: moduleRow.id, title: lesson.title, contentVersion: lesson.version, orderIndex: source.orderIndex,
      metadata: { kind: lesson.kind, estimatedMinutes: lesson.estimatedMinutes, status: "draft", objectives: lesson.objectives, sourceIds: lesson.sourceIds, prerequisiteConceptIds: lesson.prerequisiteConceptIds, exitTicketQuestionIds: lesson.exitTicketQuestionIds, versionPackImportId: created.id, importedBy: actorId } }).returning();
    for (const link of links) await tx.insert(lessonConcepts).values({ lessonId: row.id, conceptId: link.conceptId });
    for (const [index, block] of lesson.blocks.entries()) await tx.insert(contentBlocks).values({ stableId: block.id, lessonId: row.id, type: block.type, orderIndex: index, payload: { ...block.payload, ...block } });
    const lastOrder = Math.max(-1, ...sourceActivities.map(activity => activity.orderIndex));
    const questionEvaluator = sourceActivities.find(activity => activity.type === "question")?.evaluatorVersion;
    for (const [index, activity] of lesson.activities.entries()) {
      const stored = sourceActivities.find(entry => entry.stableId === activity.id);
      const questionVersion = activity.questionId ? (activity.config as { questionVersion?: number }).questionVersion : undefined;
      if (stored) await tx.insert(activities).values({ stableId: stored.stableId, lessonId: row.id, type: stored.type, prompt: stored.prompt, orderIndex: stored.orderIndex,
        evaluatorVersion: stored.evaluatorVersion, config: questionVersion === undefined ? stored.config : { ...(stored.config as Record<string, unknown>), questionVersion } });
      else {
        if (!questionEvaluator) throw new LessonVersionConflictError("No question evaluator to reuse for appended Activities");
        await tx.insert(activities).values({ stableId: activity.id, lessonId: row.id, type: activity.type, prompt: activity.prompt, orderIndex: lastOrder + 1 + index - sourceActivities.length,
          evaluatorVersion: questionEvaluator, config: JSON.parse(JSON.stringify({ ...activity.config, ...activity, questionVersion })) });
      }
    }
    // Global release uniqueness prevents ambiguous publication of the same stable version across Tracks.
    await tx.insert(contentReleases).values({ targetType: "lesson", stableId: lesson.id, version: lesson.version, contentHash: hashCanonicalJson(lesson), authorId: pack.authorId });
    return targetedResult(pack, "imported");
  }).catch(error => {
    const cause = (error as { cause?: { code?: string }; code?: string }).cause ?? error as { code?: string };
    if (cause.code === "23505") throw new LessonVersionConflictError("Conflicting persisted Pack/content version");
    throw error;
  });
}
