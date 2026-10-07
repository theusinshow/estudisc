import { and, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import {
  activities,
  concepts,
  contentBlocks,
  lessonConcepts,
  lessons,
  modules,
  packImports,
  tracks
} from "@/db/schema";
import type {
  AppliedTrackImport,
  ExistingPackImport,
  TrackImportRepository
} from "@/features/import/application/track-import-service";
import type { TrackPack } from "@/features/import/application/track-pack-schema";
import { curriculumFromV2 } from "@/features/import/application/track-pack-v2-validation";
import { DrizzleCurriculumRepository } from "./curriculum-repository";
import { DrizzleQuestionRepository } from "./question-repository";
import { releaseAuthor } from "@/features/content-qa/policy";
import { ContentQaRepository } from "./content-qa-repository";
import { executeLessonVersion } from "./lesson-version-import";
import type { LessonVersionPack } from "@/features/import/application/lesson-version-contracts";

type TrackImportDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export class DrizzleTrackImportRepository implements TrackImportRepository {
  constructor(private readonly db: TrackImportDatabase = getDatabase(),private readonly authorId="unattributed-import") {}

  executeLessonVersion(pack: LessonVersionPack, contentHash: string, preview: boolean) { return executeLessonVersion(this.db, this.authorId, pack, contentHash, preview); }

  async findPackImport(packId: string, version: number): Promise<ExistingPackImport | null> {
    const [row] = await this.db
      .select({
        packId: packImports.packId,
        version: packImports.version,
        contentHash: packImports.contentHash
      })
      .from(packImports)
      .where(and(eq(packImports.packId, packId), eq(packImports.version, version)))
      .limit(1);

    return row ?? null;
  }

  async applyTrackPack(pack: TrackPack, contentHash: string): Promise<AppliedTrackImport> {
    return this.db.transaction(async (tx) => {
      const [packImport] = await tx
        .insert(packImports)
        .values({
          schema: pack.schema,
          packId: pack.packId,
          version: pack.version,
          contentHash,
          status: "applied",
          manifest: pack
        })
        .returning({ id: packImports.id });

      if (!packImport) {
        throw new Error("Failed to create Pack import record");
      }

      const [track] = await tx
        .insert(tracks)
        .values({
          stableId: pack.track.id,
          title: pack.track.title,
          description: pack.track.description,
          packImportId: packImport.id,
          contentVersion: pack.version
        })
        .returning({ id: tracks.id, stableId: tracks.stableId });

      if (!track) {
        throw new Error("Failed to create Track record");
      }

      let importedLessons = 0;
      let importedActivities = 0;

      for (const [moduleIndex, module] of pack.track.modules.entries()) {
        const [moduleRow] = await tx
          .insert(modules)
          .values({
            stableId: module.id,
            trackId: track.id,
            title: module.title,
            subjectCode: "subjectCode" in module ? module.subjectCode : null,
            orderIndex: moduleIndex
          })
          .returning({ id: modules.id });

        if (!moduleRow) {
          throw new Error("Failed to create Module record");
        }

        for (const [lessonIndex, lesson] of module.lessons.entries()) {
          const [lessonRow] = await tx
            .insert(lessons)
            .values({
              stableId: lesson.id,
              moduleId: moduleRow.id,
              title: lesson.title,
              metadata: pack.schema === "caderno.track.v2" && "kind" in lesson ? { kind: lesson.kind, estimatedMinutes: lesson.estimatedMinutes, status: "draft", objectives: lesson.objectives, sourceIds: lesson.sourceIds, prerequisiteConceptIds: lesson.prerequisiteConceptIds, exitTicketQuestionIds: lesson.exitTicketQuestionIds } : {},
              contentVersion: lesson.version,
              orderIndex: lessonIndex
            })
            .returning({ id: lessons.id });

          if (!lessonRow) {
            throw new Error("Failed to create Lesson record");
          }

          importedLessons += 1;

          for (const concept of lesson.concepts) {
            await tx
              .insert(concepts)
              .values({
                stableId: concept.id,
                title: concept.title,
                summary: concept.summary
              })
              .onConflictDoNothing({ target: concepts.stableId });
          }

          const conceptRows = await tx
            .select({ id: concepts.id, stableId: concepts.stableId })
            .from(concepts)
            .where(
              inArray(
                concepts.stableId,
                lesson.concepts.map((concept) => concept.id)
              )
            );
          const conceptIdByStableId = new Map(conceptRows.map((concept) => [concept.stableId, concept.id]));

          for (const concept of lesson.concepts) {
            const conceptId = conceptIdByStableId.get(concept.id);

            if (!conceptId) {
              throw new Error(`Missing Concept record for ${concept.id}`);
            }

            await tx
              .insert(lessonConcepts)
              .values({ lessonId: lessonRow.id, conceptId })
              .onConflictDoNothing();
          }

          for (const [blockIndex, block] of lesson.blocks.entries()) {
            await tx.insert(contentBlocks).values({
              stableId: block.id,
              lessonId: lessonRow.id,
              type: block.type,
              orderIndex: blockIndex,
              payload: pack.schema === "caderno.track.v2" && "payload" in block ? { ...(block.payload as Record<string, unknown>), ...block } : block
            });
          }

          for (const [activityIndex, activity] of lesson.activities.entries()) {
            await tx.insert(activities).values({
              stableId: activity.id,
              lessonId: lessonRow.id,
              type: activity.type,
              prompt: activity.prompt,
              orderIndex: activityIndex,
              config: pack.schema === "caderno.track.v2" && "config" in activity ? { ...(activity.config as Record<string, unknown>), ...activity, questionVersion: "questionId" in activity ? pack.questions.find(question => question.id === activity.questionId)?.version : undefined } : activity,
              evaluatorVersion: `${pack.schema}:${pack.version}`
            });
            importedActivities += 1;
          }
        }
      }

      if (pack.schema === "caderno.track.v2") {
        await new DrizzleCurriculumRepository(tx).applyFoundation(track.id, curriculumFromV2(pack));
        await new DrizzleQuestionRepository(tx).importVersions(track.id, pack.questions);
        const qa=new ContentQaRepository(tx);
        // ADR 0033: releases are attributed to the content's author (AI run, exam), not to whoever imported it.
        await qa.register(releaseAuthor({kind:"curriculum"},pack.sources,this.authorId),"curriculum",pack.track.id,pack.version);
        for(const question of pack.questions)await qa.register(releaseAuthor({kind:"question",question},pack.sources,this.authorId),"question",question.id,question.version);
        for(const lesson of pack.track.modules.flatMap(module=>module.lessons)){
          const release=await qa.register(releaseAuthor({kind:"lesson",lesson},pack.sources,this.authorId),"lesson",lesson.id,lesson.version);
          if(release.status==="published"){
            const rows=await tx.select().from(lessons).innerJoin(modules,eq(modules.id,lessons.moduleId)).where(and(eq(lessons.stableId,lesson.id),eq(lessons.contentVersion,lesson.version),eq(modules.trackId,track.id)));
            for(const row of rows)await tx.update(lessons).set({metadata:{...row.lessons.metadata as object,status:"published",qaReleaseId:release.id}}).where(eq(lessons.id,row.lessons.id));
          }
        }
      }

      return {
        trackStableId: track.stableId,
        importedLessons,
        importedActivities
      };
    });
  }
}
