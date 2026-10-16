import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";
import { activities, attempts, lessonResumes, lessons, modules, tracks } from "@/db/schema";
import { getDatabase } from "@/db/connection";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { resumeDataSchema } from "@/features/lessons/resume-contracts";
import type { FlowLesson, FlowProgress } from "@/features/study-flow/next-lesson";
import type { MemoryStore } from "./memory/store";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
type ResumeRow = { lessonId: string; trackId: string; data: unknown; updatedAt: Date };

/**
 * A lesson-scoped resume (never a session one) is the student's own place in a whole lesson.
 * Only resumes on the current lesson's track count: older packs reuse lesson ids for other content.
 */
export function progressFromResumes(rows: readonly ResumeRow[], answeredQuestionIds: string[], currentTrackByLesson: ReadonlyMap<string, string>): FlowProgress {
  const completed = new Set<string>(); const touched = new Map<string, Date>();
  for (const row of rows) {
    if (currentTrackByLesson.get(row.lessonId) !== row.trackId) continue;
    const data = resumeDataSchema.safeParse(row.data); if (!data.success) continue;
    if (data.data.completed) completed.add(row.lessonId);
    else if (data.data.stepId !== null || data.data.drafts.length > 0) { const seen = touched.get(row.lessonId); if (!seen || seen < row.updatedAt) touched.set(row.lessonId, row.updatedAt); }
  }
  return { completedLessonIds: [...completed], inProgress: [...touched].map(([lessonId, updatedAt]) => ({ lessonId, updatedAt })), answeredQuestionIds };
}

export class StudyFlowRepository {
  constructor(private readonly db: Database = getDatabase()) {}
  async load(ownerId: string): Promise<{ lessons: FlowLesson[]; progress: FlowProgress }> {
    const [lessonRows, resumeRows, answered] = await Promise.all([
      this.db.select({ id: lessons.id, trackId: tracks.id, stableId: lessons.stableId, title: lessons.title, version: lessons.contentVersion, orderIndex: lessons.orderIndex, metadata: lessons.metadata, subject: modules.subjectCode, moduleOrder: modules.orderIndex, trackVersion: tracks.contentVersion })
        .from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).innerJoin(tracks, eq(tracks.id, modules.trackId))
        .where(sql`${lessons.metadata}->>'status' = 'published' AND ${lessons.metadata}->>'qaReleaseId' IS NOT NULL`)
        .orderBy(lessons.stableId, desc(lessons.contentVersion), desc(tracks.contentVersion)),
      this.db.select({ lessonId: lessonResumes.lessonId, trackId: lessonResumes.trackId, data: lessonResumes.data, updatedAt: lessonResumes.updatedAt }).from(lessonResumes).where(and(eq(lessonResumes.ownerId, ownerId), eq(lessonResumes.contextKey, "lesson"))),
      this.db.selectDistinct({ questionId: sql<string | null>`${activities.config}->>'questionId'` }).from(attempts).innerJoin(activities, eq(activities.id, attempts.activityId)).where(eq(attempts.ownerId, ownerId))
    ]);
    const latest = new Map<string, typeof lessonRows[number]>();
    for (const row of lessonRows) if (!latest.has(row.stableId)) latest.set(row.stableId, row);
    const ids = [...latest.values()].map(row => row.id);
    const activityRows = ids.length ? await this.db.select({ lessonId: activities.lessonId, config: activities.config }).from(activities).where(and(inArray(activities.lessonId, ids), eq(activities.type, "question"))) : [];
    const flow = [...latest.values()].map(row => ({
      id: row.stableId, title: row.title, subjectCode: row.subject ?? "", order: row.moduleOrder * 1000 + row.orderIndex,
      estimatedMinutes: Number((row.metadata as { estimatedMinutes?: number }).estimatedMinutes ?? 30),
      questionIds: activityRows.filter(activity => activity.lessonId === row.id).flatMap(activity => { const ref = questionReferenceSchema.safeParse(activity.config); return ref.success ? [ref.data.questionId] : []; })
    }));
    return { lessons: flow, progress: progressFromResumes(resumeRows, answered.flatMap(row => row.questionId ? [row.questionId] : []), new Map([...latest.values()].map(row => [row.stableId, row.trackId]))) };
  }
}

export function loadMemoryStudyFlow(store: MemoryStore, ownerId: string): { lessons: FlowLesson[]; progress: FlowProgress } {
  const latest = new Map<string, { lesson: FlowLesson; trackId: string; version: number; activityQuestions: Map<string, string> }>();
  for (const entry of store.packImports) {
    const pack = entry.manifest; if (pack?.schema !== "caderno.track.v2") continue;
    for (const moduleRecord of pack.track.modules) for (const [index, lesson] of moduleRecord.lessons.entries()) {
      if (lesson.status !== "published") continue;
      const current = latest.get(lesson.id); if (current && current.version >= lesson.version) continue;
      const activityQuestions = new Map(lesson.activities.flatMap(activity => activity.type === "question" && activity.questionId ? [[activity.id, activity.questionId] as const] : []));
      latest.set(lesson.id, { lesson: { id: lesson.id, title: lesson.title, subjectCode: moduleRecord.subjectCode, order: pack.track.modules.indexOf(moduleRecord) * 1000 + index, estimatedMinutes: lesson.estimatedMinutes ?? 30, questionIds: [...new Set(activityQuestions.values())] }, trackId: pack.track.id, version: lesson.version, activityQuestions });
    }
  }
  const questionByActivity = new Map([...latest.values()].flatMap(entry => [...entry.activityQuestions]));
  const answered = [...new Set(store.attempts.filter(attempt => attempt.ownerId === ownerId).flatMap(attempt => { const id = questionByActivity.get(attempt.activityStableId); return id ? [id] : []; }))];
  const resumes = store.lessonResumes.filter(row => row.ownerId === ownerId && !row.scope.sessionId).map(row => ({ lessonId: row.scope.lessonId, trackId: row.scope.trackId, data: row.data, updatedAt: new Date(row.updatedAt) }));
  return { lessons: [...latest.values()].map(entry => entry.lesson), progress: progressFromResumes(resumes, answered, new Map([...latest.values()].map(entry => [entry.lesson.id, entry.trackId]))) };
}
