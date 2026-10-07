import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { StudyPlanRepository } from "@/db/repositories/study-plan-repository";
import { MemoryStudyPlanRepository } from "@/db/repositories/memory-study-plan-repository";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { MemoryStudySessionRepository } from "@/db/repositories/memory-study-session-repository";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { importTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { MemoryTrackImportRepository } from "@/db/repositories/memory-store";
import { studyEvents, studySessions, tracks, questionVersions } from "@/db/schema";
import { ROUTINE_PREVIEW_TTL_MS, type RoutineSettings } from "@/features/study-sessions/routine-contracts";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
import { simulatePublication } from "./ifsc-publication-fixture";

const now = new Date("2026-10-05T15:00:00Z");
const settings: RoutineSettings = { timezone: "America/Sao_Paulo", mode: "AUTOMATIC", days: Array.from({ length: 7 }, (_, weekday) => ({ weekday, minutes: 60 })), subjects: [{ code: "MAT", priority: "normal" }], manualAllocations: [], overrides: [], reviewPercent: 20 };

describe.each(["memory", "sql"] as const)("weekly routine (%s)", kind => {
  it("enforces current budget on planning/start and preserves an already ACTIVE session", async () => {
    const database = kind === "sql" ? await createMigratedPgliteTestDatabase() : undefined;
    const store = structuredClone(getMemoryStore());
    store.studyPlans = []; store.studyPlanPreviews = []; store.studySessions = []; store.events = []; store.packImports = [];
    const fixture = JSON.parse(JSON.stringify(source));
    fixture.track.modules.forEach((module: { lessons: { status: string }[] }) => module.lessons.forEach(lesson => { lesson.status = "published"; }));
    const clock = new Date();
    try {
      await importTrackPack(fixture, database ? new DrizzleTrackImportRepository(database.db) : new MemoryTrackImportRepository(store));
      if (database) await simulatePublication(database.db);
      const routine = database ? new StudyPlanRepository(database.db) : new MemoryStudyPlanRepository(store);
      const sessions = database ? new StudySessionRepository(database.db, true) : new MemoryStudySessionRepository(store, true);
      const saved = await routine.preview("owner", settings, 0, clock); await routine.apply("owner", saved.id, clock);
      const items = [{ lessonId: "MAT-07", version: 1, title: "Aula", subjectCode: "MAT", minutes: 15, activityIds: ["q"], questions: [{ id: "q", version: 1 }] }];
      const planned = { id: crypto.randomUUID(), ownerId: "owner", status: "PLANNED", budgetMinutes: 15, items, policyVersion: "planner.v1", startedAt: null, endedAt: null, createdAt: clock };
      if (database) { const [track] = await database.db.select().from(tracks).limit(1); await database.db.insert(studySessions).values({ ...planned, trackId: track.id }); }
      else store.studySessions.push({ ...planned, trackId: fixture.track.id });
      await sessions.transition("owner", planned.id, "start");
      const dayOff = { ...settings, days: settings.days.map(day => ({ ...day, minutes: 0 })) };
      const change = await routine.preview("owner", dayOff, 1, clock); await routine.apply("owner", change.id, clock);
      expect((await sessions.plan("owner", 60))?.id).toBe(planned.id);
      expect((await sessions.get("owner", planned.id))?.items).toEqual(items);
      await sessions.transition("owner", planned.id, "complete");
      await expect(sessions.plan("owner", 15)).rejects.toMatchObject({ code: "routine_budget_exceeded" });
      const another = { ...planned, id: crypto.randomUUID() };
      if (database) { const [track] = await database.db.select().from(tracks).limit(1); await database.db.insert(studySessions).values({ ...another, trackId: track.id }); }
      else store.studySessions.push({ ...another, trackId: fixture.track.id });
      await expect(sessions.transition("owner", another.id, "start")).rejects.toMatchObject({ code: "routine_budget_exceeded" });
      expect((await sessions.get("owner", another.id))?.status).toBe("PLANNED");
      const restored = await routine.preview("owner", settings, 2, new Date()); await routine.apply("owner", restored.id, new Date());
      // Remove eligible Questions only in this disposable fixture; a failed replan must preserve its old prepared snapshot.
      if (database) await database.db.update(questionVersions).set({ status: "retired" });
      else for (const entry of store.packImports) { const manifest = entry.manifest as unknown as { questions?: { status: string }[] }; manifest.questions?.forEach(question => { question.status = "retired"; }); }
      expect(await sessions.plan("owner", 15)).toBeNull();
      expect((await sessions.get("owner", another.id))?.status).toBe("PLANNED");
    } finally { await database?.close(); }
  });

  it("isolates owners, never applies a preview implicitly, rejects stale/expired facts and applies exactly once", async () => {
    const database = kind === "sql" ? await createMigratedPgliteTestDatabase() : undefined;
    const store = structuredClone(getMemoryStore());
    store.studyPlans = []; store.studyPlanPreviews = []; store.studySessions = []; store.events = []; store.packImports = [];
    const fixture = JSON.parse(JSON.stringify(source));
    fixture.track.modules.forEach((module: { lessons: { status: string }[] }) => module.lessons.forEach(lesson => { lesson.status = "published"; }));
    try {
      expect((await importTrackPack(fixture, database ? new DrizzleTrackImportRepository(database.db) : new MemoryTrackImportRepository(store))).status).toBe("imported");
      if (database) await simulatePublication(database.db);
      const repo = database ? new StudyPlanRepository(database.db) : new MemoryStudyPlanRepository(store);
      const preview = await repo.preview("owner-a", settings, 0, now);
      expect((await repo.getState("owner-a", now)).routine).toBeNull();
      await expect(repo.apply("owner-b", preview.id, now)).rejects.toMatchObject({ code: "preview_not_found" });
      const saved = await repo.apply("owner-a", preview.id, now);
      expect(saved.routine?.revision).toBe(1);
      expect((await repo.apply("owner-a", preview.id, new Date(now.getTime() + ROUTINE_PREVIEW_TTL_MS + 1))).routine?.revision).toBe(1);
      expect((await repo.getState("owner-b", now)).routine).toBeNull();
      await expect(repo.preview("owner-a", settings, 0, now)).rejects.toMatchObject({ code: "stale_preview" });
      await expect(repo.preview("owner-a", { ...settings, subjects: [{ code: "UNKNOWN", priority: "normal" }] }, 1, now)).rejects.toMatchObject({ code: "invalid_subject" });
      const expired = await repo.preview("owner-a", settings, 1, now);
      await expect(repo.apply("owner-a", expired.id, new Date(now.getTime() + ROUTINE_PREVIEW_TTL_MS))).rejects.toMatchObject({ code: "expired_preview" });
      const staleFacts = await repo.preview("owner-a", settings, 1, now);
      const items = [{ lessonId: "MAT-07", version: 1, title: "Aula", subjectCode: "MAT", minutes: 15, activityIds: ["q"], questions: [{ id: "q", version: 1 }] }];
      const active = { id: crypto.randomUUID(), ownerId: "owner-a", status: "ACTIVE", budgetMinutes: 15, items, policyVersion: "planner.v1", startedAt: now, endedAt: null, createdAt: now };
      if (database) {
        const [track] = await database.db.select().from(tracks).limit(1);
        await database.db.insert(studySessions).values({ ...active, trackId: track.id });
      } else store.studySessions.push({ ...active, trackId: fixture.track.id });
      await expect(repo.apply("owner-a", staleFacts.id, now)).rejects.toMatchObject({ code: "stale_preview" });
      const first = await repo.preview("owner-a", settings, 1, now), second = await repo.preview("owner-a", { ...settings, reviewPercent: 10 }, 1, now);
      const results = await Promise.allSettled([repo.apply("owner-a", first.id, now), repo.apply("owner-a", second.id, now)]);
      expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
      expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
      await expect(repo.apply("owner-a", preview.id, now)).rejects.toMatchObject({ code: "stale_preview" });
      const final = await repo.getState("owner-a", now);
      expect(final.routine?.revision).toBe(2);
      expect(final.week?.activeSessionId).toBe(active.id);
      const rows = database ? await database.db.select().from(studySessions).where(eq(studySessions.id, active.id)) : store.studySessions.filter(row => row.id === active.id);
      expect(rows[0].items).toEqual(items);
      const events = database ? await database.db.select().from(studyEvents).where(eq(studyEvents.type, "study_plan_applied")) : store.events.filter(event => event.type === "study_plan_applied");
      expect(events).toHaveLength(2);
    } finally { await database?.close(); }
  });
});
