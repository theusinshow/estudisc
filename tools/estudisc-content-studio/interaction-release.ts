import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { lessons, modules, tracks } from "@/db/schema";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { loadTrackContext } from "@/db/repositories/lesson-version-import";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { importLessonVersion } from "@/features/import/application/lesson-version-policy";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { appendInteractions, interactionAuthoringSchema } from "./interaction-batch";

type Database = NonNullable<ConstructorParameters<typeof DrizzleTrackImportRepository>[0]> & NonNullable<ConstructorParameters<typeof ContentQaRepository>[0]>;

export const interactionBatchFileSchema = z.object({
  batchId: z.string().regex(/^[a-z0-9-]+$/), note: z.string().optional(), interactions: z.array(interactionAuthoringSchema).min(1)
}).strict();

/** Newest published version of a lesson with its Track/module identity, read from the content tables. */
async function publishedBase(db: Database, lessonId: string) {
  const rows = await db.select({ version: lessons.contentVersion, metadata: lessons.metadata, moduleId: modules.stableId, trackId: tracks.stableId, trackVersion: tracks.contentVersion })
    .from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).innerJoin(tracks, eq(tracks.id, modules.trackId))
    .where(and(eq(lessons.stableId, lessonId))).orderBy(desc(lessons.contentVersion));
  const row = rows.find(entry => (entry.metadata as { status?: string } | null)?.status === "published");
  if (!row) throw new Error(`${lessonId} has no published version`);
  return row;
}

/**
 * ADR 0063 release of authored interactions: one next lesson version per lesson, appended to its newest published
 * version. Preview only by default; with `publish` it imports and activates through the existing Admin Direct path.
 */
export async function releaseInteractions(db: Database, input: { batch: unknown; actor: { ownerId: string; role: "ADMIN" }; reason: string; publish: boolean }) {
  const batch = interactionBatchFileSchema.parse(input.batch);
  const byLesson = new Map<string, typeof batch.interactions>();
  for (const entry of batch.interactions) byLesson.set(entry.lessonId, [...(byLesson.get(entry.lessonId) ?? []), entry]);
  const repo = new DrizzleTrackImportRepository(db, input.actor.ownerId), qa = new ContentQaRepository(db);
  const results: { lessonId: string; from: number; to: number; questions: string[]; status: string }[] = [];
  for (const [lessonId, authored] of byLesson) {
    const target = await publishedBase(db, lessonId);
    const [manifest] = await loadTrackContext(db as never, target.trackId, target.trackVersion);
    const context = trackPackV2Schema.parse(manifest);
    const base = context.track.modules.find(entry => entry.id === target.moduleId)?.lessons.find(entry => entry.id === lessonId);
    if (!base || base.version !== target.version) throw new Error(`${lessonId}: imported context has v${base?.version}, published is v${target.version}`);
    const pack = appendInteractions({ context, moduleId: target.moduleId, base, authored, packId: `estudisc.interactions.${batch.batchId}.${lessonId.toLowerCase()}`, authorId: input.actor.ownerId, generationRunId: batch.batchId });
    const preview = await importLessonVersion(pack, repo, true);
    let status: string = preview.status;
    if (input.publish && status === "ready") {
      status = (await importLessonVersion(pack, repo)).status;
      await qa.publishLessonsDirect(input.actor, { lessons: [{ lessonId, version: pack.lesson.version }], reason: input.reason });
      status = `${status}+published`;
    }
    results.push({ lessonId, from: base.version, to: pack.lesson.version, questions: (pack.questionVersions ?? []).map(question => question.id), status });
  }
  return results;
}
