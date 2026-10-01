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

type TrackImportDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export class DrizzleTrackImportRepository implements TrackImportRepository {
  constructor(private readonly db: TrackImportDatabase = getDatabase()) {}

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
              metadata: pack.schema === "caderno.track.v2" && "kind" in lesson ? { kind: lesson.kind, estimatedMinutes: lesson.estimatedMinutes, status: lesson.status, objectives: lesson.objectives, sourceIds: lesson.sourceIds, prerequisiteConceptIds: lesson.prerequisiteConceptIds, exitTicketQuestionIds: lesson.exitTicketQuestionIds } : {},
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
              config: pack.schema === "caderno.track.v2" && "config" in activity ? { ...(activity.config as Record<string, unknown>), ...activity } : activity,
              evaluatorVersion: `${pack.schema}:${pack.version}`
            });
            importedActivities += 1;
          }
        }
      }

      if (pack.schema === "caderno.track.v2") {
        await new DrizzleCurriculumRepository(tx).applyFoundation(track.id, curriculumFromV2(pack));
        await new DrizzleQuestionRepository(tx).importVersions(track.id, pack.questions);
      }

      return {
        trackStableId: track.stableId,
        importedLessons,
        importedActivities
      };
    });
  }
}
