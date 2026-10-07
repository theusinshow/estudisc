import { and, asc, desc, eq,sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { ensureDatabaseReady, getDatabase } from "@/db/connection";
import { activities, concepts, contentBlocks, lessonConcepts, lessons, modules, tracks } from "@/db/schema";
import type * as schema from "@/db/schema";

type CatalogDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type TrackListItem = Readonly<{
  stableId: string;
  title: string;
  description: string | null;
  lessonCount: number;
}>;

export type TrackDetail = Readonly<{
  stableId: string;
  title: string;
  description: string | null;
  modules: ReadonlyArray<{
    stableId: string;
    title: string;
    lessons: ReadonlyArray<{
      stableId: string;
      title: string;
      activityCount: number;
    }>;
  }>;
}>;

export type LessonDetail = Readonly<{
  resumeScope?: { trackId: string; lessonId: string; version: number };
  stableId: string;
  title: string;
  trackStableId: string;
  trackTitle: string;
  metadata?:Record<string,unknown>;
  concepts: ReadonlyArray<{
    stableId: string;
    title: string;
    summary: string | null;
  }>;
  blocks: ReadonlyArray<{
    stableId: string;
    type: string;
    payload: unknown;
  }>;
  activities: ReadonlyArray<{
    stableId: string;
    type: string;
    prompt: string;
    config: unknown;
  }>;
}>;

export type ConceptDetail = Readonly<{
  stableId: string;
  title: string;
  summary: string | null;
  lessons: ReadonlyArray<{
    stableId: string;
    title: string;
    trackStableId: string;
    trackTitle: string;
    activityCount: number;
  }>;
}>;

export type KnowledgeMapConcept = Readonly<{
  stableId: string;
  title: string;
  summary: string | null;
  lessonCount: number;
  trackTitles: string[];
  /** Module titles, the subject areas a concept is taught in. */
  areaTitles: string[];
}>;

export class CatalogRepository {
  constructor(private readonly db: CatalogDatabase = getDatabase()) {}

  async listTracks(publishedOnly=false): Promise<TrackListItem[]> {
    const rows = await this.db
      .select({
        stableId: tracks.stableId,
        title: tracks.title,
        description: tracks.description,
        lessonStableId: lessons.stableId
      })
      .from(tracks)
      .leftJoin(modules, eq(modules.trackId, tracks.id))
      .leftJoin(lessons, and(eq(lessons.moduleId, modules.id),publishedOnly?sql`(${lessons.metadata}->>'kind' IS NULL OR (${lessons.metadata}->>'status'='published' AND ${lessons.metadata}->>'qaReleaseId' IS NOT NULL))`:undefined))
      .orderBy(asc(tracks.title));

    const byTrack = new Map<
      string,
      {
        stableId: string;
        title: string;
        description: string | null;
        lessonCount: number;
        lessonIds: Set<string>;
      }
    >();

    for (const row of rows) {
      const existing =
        byTrack.get(row.stableId) ??
        ({
          stableId: row.stableId,
          title: row.title,
          description: row.description,
          lessonCount: 0,
          lessonIds: new Set<string>()
        });

      if (row.lessonStableId) {
        existing.lessonIds.add(row.lessonStableId);
        existing.lessonCount = existing.lessonIds.size;
      }

      byTrack.set(row.stableId, existing);
    }

    return Array.from(byTrack.values()).map((track) => ({
      stableId: track.stableId,
      title: track.title,
      description: track.description,
      lessonCount: track.lessonCount
    }));
  }

  async getTrack(stableId: string,publishedOnly=false): Promise<TrackDetail | null> {
    const [track] = await this.db
      .select({
        id: tracks.id,
        stableId: tracks.stableId,
        title: tracks.title,
        description: tracks.description
      })
      .from(tracks)
      .where(eq(tracks.stableId, stableId))
      .limit(1);

    if (!track) {
      return null;
    }

    const rows = await this.db
      .select({
        moduleId: modules.id,
        moduleStableId: modules.stableId,
        moduleTitle: modules.title,
        lessonStableId: lessons.stableId,
        lessonTitle: lessons.title,
        activityStableId: activities.stableId
      })
      .from(modules)
      .leftJoin(lessons, eq(lessons.moduleId, modules.id))
      .leftJoin(activities, eq(activities.lessonId, lessons.id))
      .where(and(eq(modules.trackId, track.id),publishedOnly?sql`(${lessons.metadata}->>'kind' IS NULL OR (${lessons.metadata}->>'status'='published' AND ${lessons.metadata}->>'qaReleaseId' IS NOT NULL))`:undefined))
      .orderBy(asc(modules.orderIndex), asc(lessons.orderIndex), asc(activities.orderIndex));

    const moduleMap = new Map<
      string,
      {
        stableId: string;
        title: string;
        lessonMap: Map<string, { stableId: string; title: string; activityIds: Set<string> }>;
      }
    >();

    for (const row of rows) {
      const moduleEntry =
        moduleMap.get(row.moduleId) ??
        {
          stableId: row.moduleStableId,
          title: row.moduleTitle,
          lessonMap: new Map<string, { stableId: string; title: string; activityIds: Set<string> }>()
        };

      if (row.lessonStableId && row.lessonTitle) {
        const lessonEntry =
          moduleEntry.lessonMap.get(row.lessonStableId) ??
          {
            stableId: row.lessonStableId,
            title: row.lessonTitle,
            activityIds: new Set<string>()
          };

        if (row.activityStableId) {
          lessonEntry.activityIds.add(row.activityStableId);
        }

        moduleEntry.lessonMap.set(row.lessonStableId, lessonEntry);
      }

      moduleMap.set(row.moduleId, moduleEntry);
    }

    return {
      stableId: track.stableId,
      title: track.title,
      description: track.description,
      modules: Array.from(moduleMap.values()).map((module) => ({
        stableId: module.stableId,
        title: module.title,
        lessons: Array.from(module.lessonMap.values()).map((lesson) => ({
          stableId: lesson.stableId,
          title: lesson.title,
          activityCount: lesson.activityIds.size
        }))
      }))
    };
  }

  async getLesson(stableId: string, version?:number,trackId?:string): Promise<LessonDetail | null> {
    const [lesson] = await this.db
      .select({
        id: lessons.id,
        stableId: lessons.stableId,
        title: lessons.title,
        metadata: lessons.metadata,
        trackStableId: tracks.stableId,
        trackTitle: tracks.title,
        internalTrackId: tracks.id, version: lessons.contentVersion
      })
      .from(lessons)
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .innerJoin(tracks, eq(tracks.id, modules.trackId))
      .where(and(eq(lessons.stableId,stableId),version===undefined?undefined:eq(lessons.contentVersion,version),trackId===undefined?undefined:eq(tracks.id,trackId)))
      .orderBy(desc(lessons.contentVersion))
      .limit(1);

    if (!lesson) {
      return null;
    }

    const [conceptRows, blockRows, activityRows] = await Promise.all([
      this.db
        .select({
          stableId: concepts.stableId,
          title: concepts.title,
          summary: concepts.summary
        })
        .from(lessonConcepts)
        .innerJoin(concepts, eq(concepts.id, lessonConcepts.conceptId))
        .where(eq(lessonConcepts.lessonId, lesson.id))
        .orderBy(asc(concepts.title)),
      this.db
        .select({
          stableId: contentBlocks.stableId,
          type: contentBlocks.type,
          payload: contentBlocks.payload
        })
        .from(contentBlocks)
        .where(eq(contentBlocks.lessonId, lesson.id))
        .orderBy(asc(contentBlocks.orderIndex)),
      this.db
        .select({
          stableId: activities.stableId,
          type: activities.type,
          prompt: activities.prompt,
          config: activities.config
        })
        .from(activities)
        .where(eq(activities.lessonId, lesson.id))
        .orderBy(asc(activities.orderIndex))
    ]);

    return {
      stableId: lesson.stableId,
      title: lesson.title,
      metadata:lesson.metadata as Record<string,unknown>,
      resumeScope: (lesson.metadata as { status?: string; qaReleaseId?: string })?.status === "published" && (lesson.metadata as { qaReleaseId?: string })?.qaReleaseId ? { trackId: lesson.internalTrackId, lessonId: lesson.stableId, version: lesson.version } : undefined,
      trackStableId: lesson.trackStableId,
      trackTitle: lesson.trackTitle,
      concepts: conceptRows,
      blocks: blockRows,
      activities: activityRows
    };
  }

  async getConcept(stableId: string): Promise<ConceptDetail | null> {
    const [concept] = await this.db
      .select({
        id: concepts.id,
        stableId: concepts.stableId,
        title: concepts.title,
        summary: concepts.summary
      })
      .from(concepts)
      .where(eq(concepts.stableId, stableId))
      .limit(1);

    if (!concept) {
      return null;
    }

    const rows = await this.db
      .select({
        lessonStableId: lessons.stableId,
        lessonTitle: lessons.title,
        trackStableId: tracks.stableId,
        trackTitle: tracks.title,
        activityStableId: activities.stableId
      })
      .from(lessonConcepts)
      .innerJoin(lessons, eq(lessons.id, lessonConcepts.lessonId))
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .innerJoin(tracks, eq(tracks.id, modules.trackId))
      .leftJoin(activities, eq(activities.lessonId, lessons.id))
      .where(eq(lessonConcepts.conceptId, concept.id))
      .orderBy(asc(tracks.title), asc(lessons.orderIndex), asc(activities.orderIndex));

    const lessonMap = new Map<
      string,
      {
        stableId: string;
        title: string;
        trackStableId: string;
        trackTitle: string;
        activityIds: Set<string>;
      }
    >();

    for (const row of rows) {
      const lessonEntry =
        lessonMap.get(row.lessonStableId) ??
        {
          stableId: row.lessonStableId,
          title: row.lessonTitle,
          trackStableId: row.trackStableId,
          trackTitle: row.trackTitle,
          activityIds: new Set<string>()
        };

      if (row.activityStableId) {
        lessonEntry.activityIds.add(row.activityStableId);
      }

      lessonMap.set(row.lessonStableId, lessonEntry);
    }

    return {
      stableId: concept.stableId,
      title: concept.title,
      summary: concept.summary,
      lessons: Array.from(lessonMap.values()).map((lesson) => ({
        stableId: lesson.stableId,
        title: lesson.title,
        trackStableId: lesson.trackStableId,
        trackTitle: lesson.trackTitle,
        activityCount: lesson.activityIds.size
      }))
    };
  }

  async listKnowledgeMapConcepts(): Promise<KnowledgeMapConcept[]> {
    const rows = await this.db
      .select({
        stableId: concepts.stableId,
        title: concepts.title,
        summary: concepts.summary,
        lessonStableId: lessons.stableId,
        moduleTitle: modules.title,
        trackTitle: tracks.title
      })
      .from(concepts)
      .leftJoin(lessonConcepts, eq(lessonConcepts.conceptId, concepts.id))
      .leftJoin(lessons, eq(lessons.id, lessonConcepts.lessonId))
      .leftJoin(modules, eq(modules.id, lessons.moduleId))
      .leftJoin(tracks, eq(tracks.id, modules.trackId))
      .orderBy(asc(concepts.title));

    const conceptMap = new Map<
      string,
      {
        stableId: string;
        title: string;
        summary: string | null;
        lessonIds: Set<string>;
        trackTitles: Set<string>;
        areaTitles: Set<string>;
      }
    >();

    for (const row of rows) {
      const existing =
        conceptMap.get(row.stableId) ??
        {
          stableId: row.stableId,
          title: row.title,
          summary: row.summary,
          lessonIds: new Set<string>(),
          trackTitles: new Set<string>(),
          areaTitles: new Set<string>()
        };

      if (row.lessonStableId) {
        existing.lessonIds.add(row.lessonStableId);
      }

      if (row.trackTitle) {
        existing.trackTitles.add(row.trackTitle);
      }

      if (row.moduleTitle) {
        existing.areaTitles.add(row.moduleTitle);
      }

      conceptMap.set(row.stableId, existing);
    }

    return Array.from(conceptMap.values()).map((concept) => ({
      stableId: concept.stableId,
      title: concept.title,
      summary: concept.summary,
      lessonCount: concept.lessonIds.size,
      trackTitles: Array.from(concept.trackTitles).sort((left, right) => left.localeCompare(right)),
      areaTitles: Array.from(concept.areaTitles).sort((left, right) => left.localeCompare(right))
    }));
  }
}

export async function withCatalogRepository<T>(read: (repository: CatalogRepository) => Promise<T>) {
  await ensureDatabaseReady();
  return read(new CatalogRepository());
}
