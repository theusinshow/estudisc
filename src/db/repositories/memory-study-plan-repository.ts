import { subjectLabel } from "@/features/assessments/labels";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { ROUTINE_POLICY, ROUTINE_PREVIEW_TTL_MS, RoutineConflictError, routinePreviewSchema, routineRecordSchema, routineStateSchema, routineWeekSchema, type RoutineSettings } from "@/features/study-sessions/routine-contracts";
import { buildRoutineWeek, normalizeRoutine, type RoutineContext } from "@/features/study-sessions/routine-policy";
import { routineDependencyHash } from "@/features/study-sessions/routine-context";
import { getMemoryStore, type MemoryStore } from "./memory/store";

export function memoryRoutineContext(store: MemoryStore, ownerId: string): RoutineContext {
  const codes = store.packImports.flatMap(entry => {
    const parsed = trackPackV2Schema.safeParse(entry.manifest);
    return parsed.success ? parsed.data.track.modules.filter(module => module.lessons.some(lesson => lesson.status === "published")).map(module => module.subjectCode) : [];
  });
  return { subjectCodes: [...new Set(codes)].sort(), sessions: store.studySessions.filter(session => session.ownerId === ownerId && ["ACTIVE", "COMPLETED"].includes(session.status)) };
}

export class MemoryStudyPlanRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async getState(ownerId: string, now = new Date(), sharedContext?: RoutineContext) {
    const row = this.store.studyPlans.find(plan => plan.ownerId === ownerId), context = sharedContext ?? memoryRoutineContext(this.store, ownerId);
    const routine = row ? routineRecordSchema.parse({ revision: row.revision, settings: normalizeRoutine(row.settings), updatedAt: row.updatedAt.toISOString() }) : null;
    return routineStateSchema.parse({ routine, subjects: context.subjectCodes.map(code => ({ code, title: Object.hasOwn(subjectLabel, code) ? subjectLabel[code] : code })), week: routine ? buildRoutineWeek(routine.settings, context, now) : null });
  }

  async preview(ownerId: string, input: RoutineSettings, baseRevision: number, now = new Date()) {
    const current = this.store.studyPlans.find(plan => plan.ownerId === ownerId);
    if ((current?.revision ?? 0) !== baseRevision) throw new RoutineConflictError("stale_preview");
    const settings = normalizeRoutine(input), context = memoryRoutineContext(this.store, ownerId);
    if (settings.subjects.some(subject => !context.subjectCodes.includes(subject.code))) throw new RoutineConflictError("invalid_subject");
    const week = buildRoutineWeek(settings, context, now), id = crypto.randomUUID(), expiresAt = new Date(now.getTime() + ROUTINE_PREVIEW_TTL_MS);
    this.store.studyPlanPreviews.push({ id, ownerId, baseRevision, settings, snapshot: week, dependencyHash: routineDependencyHash(settings, context, now), policyVersion: ROUTINE_POLICY, createdAt: now, expiresAt, appliedRevision: null, appliedAt: null });
    return routinePreviewSchema.parse({ id, baseRevision, settings, week, expiresAt: expiresAt.toISOString() });
  }

  async apply(ownerId: string, previewId: string, now = new Date()) {
    const preview = this.store.studyPlanPreviews.find(row => row.id === previewId && row.ownerId === ownerId);
    if (!preview) throw new RoutineConflictError("preview_not_found");
    const current = this.store.studyPlans.find(plan => plan.ownerId === ownerId);
    if (preview.appliedRevision !== null) {
      if (current?.revision !== preview.appliedRevision) throw new RoutineConflictError("stale_preview");
      return this.getState(ownerId, now);
    }
    if (preview.expiresAt.getTime() <= now.getTime()) throw new RoutineConflictError("expired_preview");
    if ((current?.revision ?? 0) !== preview.baseRevision || preview.policyVersion !== ROUTINE_POLICY) throw new RoutineConflictError("stale_preview");
    const settings = normalizeRoutine(preview.settings), context = memoryRoutineContext(this.store, ownerId);
    if (routineDependencyHash(settings, context, now) !== preview.dependencyHash) throw new RoutineConflictError("stale_preview");
    const revision = preview.baseRevision + 1;
    const row = { ownerId, revision, settings: structuredClone(settings), updatedAt: now };
    if (current) Object.assign(current, row); else this.store.studyPlans.push(row);
    preview.appliedRevision = revision; preview.appliedAt = now;
    this.store.events.push({ id: crypto.randomUUID(), ownerId, type: "study_plan_applied", entityType: "study_plan", entityId: ownerId, payload: { revision, policyVersion: ROUTINE_POLICY, mode: settings.mode, weekStart: routineWeekSchema.parse(preview.snapshot).weekStart }, occurredAt: now });
    return this.getState(ownerId, now);
  }
}
