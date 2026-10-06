import type { HistoryEvent } from "@/db/repositories/history-repository";
import type { LessonProgressSummary, TrackProgressSummary } from "@/db/repositories/progress-repository";
import { getMemoryStore } from './store';


export class MemoryProgressRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async getLessonProgress(ownerId: string, lessonStableId: string): Promise<LessonProgressSummary | null> {
    const lesson = this.store.lessons.find((entry) => entry.stableId === lessonStableId);

    if (!lesson) {
      return null;
    }

    const activityIds = this.store.activities
      .filter((activity) => activity.lessonStableId === lesson.stableId)
      .map((activity) => activity.stableId);
    const attemptRows = this.listAttemptRows(ownerId, activityIds);

    return {
      lessonStableId: lesson.stableId,
      totalActivities: activityIds.length,
      attemptedActivities: new Set(attemptRows.map((attempt) => attempt.activityStableId)).size,
      passedActivities: new Set(
        attemptRows.filter((attempt) => attempt.outcome === "passed").map((attempt) => attempt.activityStableId)
      ).size,
      masteryStatus: "not_calculated"
    };
  }

  async getTrackProgress(ownerId: string, trackStableId: string): Promise<TrackProgressSummary | null> {
    const track = this.store.tracks.find((entry) => entry.stableId === trackStableId);

    if (!track) {
      return null;
    }

    const lessonIds = this.store.lessons
      .filter((lesson) =>
        this.store.modules.some(
          (module) => module.stableId === lesson.moduleStableId && module.trackStableId === track.stableId
        )
      )
      .map((lesson) => lesson.stableId);
    const activitiesByLesson = new Map<string, string[]>();

    for (const lessonId of lessonIds) {
      activitiesByLesson.set(
        lessonId,
        this.store.activities
          .filter((activity) => activity.lessonStableId === lessonId)
          .map((activity) => activity.stableId)
      );
    }

    const activityIds = Array.from(activitiesByLesson.values()).flat();
    const attemptRows = this.listAttemptRows(ownerId, activityIds);
    const passedActivityIds = new Set(
      attemptRows.filter((attempt) => attempt.outcome === "passed").map((attempt) => attempt.activityStableId)
    );
    const completedLessonStableIds = Array.from(activitiesByLesson).filter(
      ([, lessonActivityIds]) =>
        lessonActivityIds.length > 0 && lessonActivityIds.every((activityId) => passedActivityIds.has(activityId))
    ).map(([lessonStableId]) => lessonStableId);
    const completedLessons = completedLessonStableIds.length;

    return {
      trackStableId: track.stableId,
      totalLessons: lessonIds.length,
      completedLessons,
      completedLessonStableIds,
      totalActivities: activityIds.length,
      attemptedActivities: new Set(attemptRows.map((attempt) => attempt.activityStableId)).size,
      passedActivities: passedActivityIds.size,
      masteryStatus: "not_calculated"
    };
  }

  private listAttemptRows(ownerId: string, activityIds: string[]) {
    return this.store.attempts.filter(
      (attempt) => attempt.ownerId === ownerId && activityIds.includes(attempt.activityStableId)
    );
  }
}

export class MemoryHistoryRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async listEvents(ownerId="local-owner"): Promise<HistoryEvent[]> {
    return this.store.events.filter(event=>!event.ownerId||event.ownerId===ownerId).sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
  }
}
