import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { and, desc, eq } from "drizzle-orm";
import { getDatabase, getDatabaseUrl } from "@/db/connection";
import { activities, attempts, lessons, modules, tracks } from "@/db/schema";
import { getMemoryStore } from "@/db/repositories/memory-store";

export type RecommendationLesson = { id: string; title: string; subjectCode: string; estimatedMinutes: number; importance: number; prerequisiteIds: string[]; activityCount: number; attempted: number; passed: number };
export async function listRecommendationLessons(ownerId: string): Promise<RecommendationLesson[]> {
  const memory = getDatabaseUrl() === "memory://local";
  const store = memory ? getMemoryStore() : null;
  const db = memory ? null : getDatabase();
  const memoryLessons = store ? store.packImports.flatMap(entry => { const parsed = trackPackV2Schema.safeParse(entry.manifest); return parsed.success ? parsed.data.track.modules.flatMap(module => module.lessons.map(lesson => ({ id: `${lesson.id}@${lesson.version}`, stableId: lesson.id, title: lesson.title, version: lesson.version, trackVersion: parsed.data.version, metadata: { status: lesson.status, estimatedMinutes: lesson.estimatedMinutes, prerequisiteConceptIds: lesson.prerequisiteConceptIds }, subject: module.subjectCode }))) : []; }) : [];
  const [rows, activityRows, attemptRows] = store ? [memoryLessons, store.activities.map(a => ({ id: a.stableId, lesson: `${a.lessonStableId}@${store.lessons.find(lesson => lesson.stableId === a.lessonStableId)?.contentVersion}`, version: store.lessons.find(lesson => lesson.stableId === a.lessonStableId)?.contentVersion })), store.attempts.filter(a => a.ownerId === ownerId).map(a => ({ activity: a.activityStableId, outcome: a.outcome }))] : await Promise.all([
    db!.select({ id: lessons.id, stableId: lessons.stableId, title: lessons.title, version: lessons.contentVersion, trackVersion: tracks.contentVersion, metadata: lessons.metadata, subject: modules.subjectCode }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).innerJoin(tracks, eq(tracks.id, modules.trackId)).orderBy(desc(lessons.contentVersion)),
    db!.select({ id: activities.id, lesson: lessons.id, version: lessons.contentVersion }).from(activities).innerJoin(lessons, eq(lessons.id, activities.lessonId)),
    db!.select({ activity: attempts.activityId, outcome: attempts.outcome }).from(attempts).where(and(eq(attempts.ownerId, ownerId)))
  ]);
  const latest = new Map<string, typeof rows[number]>();
  for (const row of [...rows].sort((a, b) => b.version - a.version || b.trackVersion - a.trackVersion).filter(row => (row.metadata as { status?: string }).status === "published")) if (!latest.has(row.stableId)) latest.set(row.stableId, row);
  return [...latest.values()].filter(row => (row.metadata as { status?: string }).status === "published").map(row => {
    const metadata = row.metadata as { estimatedMinutes?: number; prerequisiteConceptIds?: string[] };
    const ids = new Set(activityRows.filter(a => a.lesson === row.id && a.version === row.version).map(a => a.id));
    const answered = attemptRows.filter(a => a.activity !== null && ids.has(a.activity));
    return { id: row.stableId, title: row.title, subjectCode: row.subject ?? "", estimatedMinutes: metadata.estimatedMinutes ?? 30, importance: 1, prerequisiteIds: metadata.prerequisiteConceptIds ?? [], activityCount: ids.size, attempted: new Set(answered.map(a => a.activity)).size, passed: new Set(answered.filter(a => a.outcome === "passed").map(a => a.activity)).size };
  });
}
