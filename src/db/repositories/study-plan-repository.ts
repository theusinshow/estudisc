import { and, eq, inArray, or, gte, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { lessons, modules, owners, studyEvents, studyPlans, studyPlanPreviews, studySessions } from "@/db/schema";
import { subjectLabel } from "@/features/assessments/labels";
import { ROUTINE_POLICY, ROUTINE_PREVIEW_TTL_MS, RoutineConflictError, routinePreviewSchema, routineRecordSchema, routineStateSchema, routineWeekSchema, type RoutineSettings } from "@/features/study-sessions/routine-contracts";
import { buildRoutineWeek, normalizeRoutine, type RoutineContext } from "@/features/study-sessions/routine-policy";
import { routineDependencyHash } from "@/features/study-sessions/routine-context";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export class StudyPlanRepository {
  constructor(private readonly db: Database = getDatabase()) {}

  private async context(ownerId: string, now: Date): Promise<RoutineContext> {
    const [subjects, sessions] = await Promise.all([
      this.db.selectDistinct({ code: modules.subjectCode }).from(modules).innerJoin(lessons, eq(lessons.moduleId, modules.id)).where(sql`${lessons.metadata}->>'status' = 'published'`),
      this.db.select().from(studySessions).where(and(eq(studySessions.ownerId, ownerId), inArray(studySessions.status, ["ACTIVE", "COMPLETED"]), or(eq(studySessions.status, "ACTIVE"), gte(studySessions.endedAt, new Date(now.getTime() - 9 * 86400_000)))))
    ]);
    return { subjectCodes: subjects.map(row => row.code).filter((code): code is string => Boolean(code)).sort(), sessions };
  }

  async getState(ownerId: string, now = new Date(), sharedContext?: RoutineContext) {
    const [[row], context] = await Promise.all([this.db.select().from(studyPlans).where(eq(studyPlans.ownerId, ownerId)), sharedContext ? Promise.resolve(sharedContext) : this.context(ownerId, now)]);
    if (row && row.policyVersion !== ROUTINE_POLICY) throw new Error("Unsupported routine policy");
    const routine = row ? routineRecordSchema.parse({ revision: row.revision, settings: normalizeRoutine(row.settings), updatedAt: row.updatedAt.toISOString() }) : null;
    return routineStateSchema.parse({ routine, subjects: context.subjectCodes.map(code => ({ code, title: Object.hasOwn(subjectLabel, code) ? subjectLabel[code] : code })), week: routine ? buildRoutineWeek(routine.settings, context, now) : null });
  }

  async preview(ownerId: string, input: RoutineSettings, baseRevision: number, now = new Date()) {
    return this.db.transaction(async tx => {
      await tx.insert(owners).values({ id: ownerId, displayName: "Private learner" }).onConflictDoNothing();
      await tx.select().from(owners).where(eq(owners.id, ownerId)).for("update");
      const repo = new StudyPlanRepository(tx);
      const [current] = await tx.select().from(studyPlans).where(eq(studyPlans.ownerId, ownerId));
      if ((current?.revision ?? 0) !== baseRevision) throw new RoutineConflictError("stale_preview");
      const settings = normalizeRoutine(input), context = await repo.context(ownerId, now);
      if (settings.subjects.some(subject => !context.subjectCodes.includes(subject.code))) throw new RoutineConflictError("invalid_subject");
      const week = buildRoutineWeek(settings, context, now), id = crypto.randomUUID(), expiresAt = new Date(now.getTime() + ROUTINE_PREVIEW_TTL_MS);
      await tx.insert(studyPlanPreviews).values({ id, ownerId, baseRevision, settings, snapshot: week, dependencyHash: routineDependencyHash(settings, context, now), policyVersion: ROUTINE_POLICY, createdAt: now, expiresAt });
      return routinePreviewSchema.parse({ id, baseRevision, settings, week, expiresAt: expiresAt.toISOString() });
    });
  }

  async apply(ownerId: string, previewId: string, now = new Date()) {
    return this.db.transaction(async tx => {
      await tx.select().from(owners).where(eq(owners.id, ownerId)).for("update");
      const [preview] = await tx.select().from(studyPlanPreviews).where(and(eq(studyPlanPreviews.id, previewId), eq(studyPlanPreviews.ownerId, ownerId))).for("update");
      if (!preview) throw new RoutineConflictError("preview_not_found");
      const [current] = await tx.select().from(studyPlans).where(eq(studyPlans.ownerId, ownerId));
      const repo = new StudyPlanRepository(tx);
      if (preview.appliedRevision !== null) {
        if (current?.revision !== preview.appliedRevision) throw new RoutineConflictError("stale_preview");
        return repo.getState(ownerId, now);
      }
      if (preview.expiresAt.getTime() <= now.getTime()) throw new RoutineConflictError("expired_preview");
      if ((current?.revision ?? 0) !== preview.baseRevision || preview.policyVersion !== ROUTINE_POLICY) throw new RoutineConflictError("stale_preview");
      const settings = normalizeRoutine(preview.settings), context = await repo.context(ownerId, now);
      if (routineDependencyHash(settings, context, now) !== preview.dependencyHash) throw new RoutineConflictError("stale_preview");
      const revision = preview.baseRevision + 1;
      await tx.insert(studyPlans).values({ ownerId, revision, settings, policyVersion: ROUTINE_POLICY, updatedAt: now }).onConflictDoUpdate({ target: studyPlans.ownerId, set: { revision, settings, policyVersion: ROUTINE_POLICY, updatedAt: now } });
      await tx.update(studyPlanPreviews).set({ appliedRevision: revision, appliedAt: now }).where(eq(studyPlanPreviews.id, preview.id));
      await tx.insert(studyEvents).values({ ownerId, type: "study_plan_applied", entityType: "study_plan", entityId: ownerId, payload: { revision, policyVersion: ROUTINE_POLICY, mode: settings.mode, weekStart: routineWeekSchema.parse(preview.snapshot).weekStart }, occurredAt: now });
      return repo.getState(ownerId, now);
    });
  }
}
