import { and, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { getDatabase } from "@/db/connection";
import { activities, attempts, lessons, modules, tracks } from "@/db/schema";
import type * as schema from "@/db/schema";

type ProgressDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type LessonProgressSummary = Readonly<{
  lessonStableId: string;
  totalActivities: number;
  attemptedActivities: number;
  passedActivities: number;
  masteryStatus: "not_calculated";
}>;

export type TrackProgressSummary = Readonly<{
  trackStableId: string;
  totalLessons: number;
  completedLessons: number;
  completedLessonStableIds: readonly string[];
  totalActivities: number;
  attemptedActivities: number;
  passedActivities: number;
  masteryStatus: "not_calculated";
}>;

export class ProgressRepository {
  constructor(private readonly db: ProgressDatabase = getDatabase()) {}

  async getLessonProgress(ownerId: string, lessonStableId: string): Promise<LessonProgressSummary | null> {
    const [lesson] = await this.db
      .select({ id: lessons.id, stableId: lessons.stableId })
      .from(lessons)
      .where(eq(lessons.stableId, lessonStableId))
      .limit(1);

    if (!lesson) {
      return null;
    }

    const activityRows = await this.db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.lessonId, lesson.id));

    const activityIds = activityRows.map((activity) => activity.id);
    const attemptRows = await this.listAttemptRows(ownerId, activityIds);

    return {
      lessonStableId: lesson.stableId,
      totalActivities: activityIds.length,
      attemptedActivities: new Set(attemptRows.map((attempt) => attempt.activityId)).size,
      passedActivities: new Set(
        attemptRows.filter((attempt) => attempt.outcome === "passed").map((attempt) => attempt.activityId)
      ).size,
      masteryStatus: "not_calculated"
    };
  }

  async getTrackProgress(ownerId: string, trackStableId: string): Promise<TrackProgressSummary | null> {
    const [track] = await this.db
      .select({ id: tracks.id, stableId: tracks.stableId })
      .from(tracks)
      .where(eq(tracks.stableId, trackStableId))
      .limit(1);

    if (!track) {
      return null;
    }

    const rows = await this.db
      .select({
        lessonId: lessons.stableId,
        activityId: activities.id
      })
      .from(modules)
      .innerJoin(lessons, eq(lessons.moduleId, modules.id))
      .innerJoin(activities, eq(activities.lessonId, lessons.id))
      .where(eq(modules.trackId, track.id));

    const lessonIds = Array.from(new Set(rows.map((row) => row.lessonId)));
    const activityIds = rows.map((row) => row.activityId);
    const attemptRows = await this.listAttemptRows(ownerId, activityIds);
    const passedActivityIds = new Set(
      attemptRows.filter((attempt) => attempt.outcome === "passed").map((attempt) => attempt.activityId)
    );
    const activityIdsByLesson = new Map<string, string[]>();

    for (const row of rows) {
      activityIdsByLesson.set(row.lessonId, [...(activityIdsByLesson.get(row.lessonId) ?? []), row.activityId]);
    }

    const completedLessonStableIds = Array.from(activityIdsByLesson).filter(
      ([, lessonActivityIds]) =>
        lessonActivityIds.length > 0 && lessonActivityIds.every((activityId) => passedActivityIds.has(activityId))
    ).map(([lessonStableId]) => lessonStableId);

    return {
      trackStableId: track.stableId,
      totalLessons: lessonIds.length,
      completedLessons: completedLessonStableIds.length,
      completedLessonStableIds,
      totalActivities: activityIds.length,
      attemptedActivities: new Set(attemptRows.map((attempt) => attempt.activityId)).size,
      passedActivities: passedActivityIds.size,
      masteryStatus: "not_calculated"
    };
  }

  private async listAttemptRows(ownerId: string, activityIds: string[]) {
    if (activityIds.length === 0) {
      return [];
    }

    return this.db
      .select({
        activityId: attempts.activityId,
        outcome: attempts.outcome
      })
      .from(attempts)
      .where(and(eq(attempts.ownerId, ownerId), inArray(attempts.activityId, activityIds)));
  }
}
