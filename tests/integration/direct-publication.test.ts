// @vitest-environment node
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { attempts, conceptEvidence, contentPublicationEvents, contentQaReviews, lessons, questionVersions, studyEvents } from "@/db/schema";
import { importTrackPack, trackPackV2Schema } from "@/features/import/api";
import { directPublicationSchema } from "@/features/content-qa/direct-publication";
import { canExposeQuestion } from "@/features/questions/exposure";
import { DrizzleQuestionRepository } from "@/db/repositories/question-repository";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

const admin = { ownerId: "owner", role: "ADMIN" as const };
const reason = "Publicação direta solicitada pelo responsável por este conteúdo.";
const target = { lessonId: "POR-01", version: 1 };

describe("direct ADMIN publication", () => {
  it("publishes all forty Science lessons atomically without reviews, preserves content/state and retries idempotently", async () => {
    const database = await createMigratedPgliteTestDatabase();
    try {
      const importer = new DrizzleTrackImportRepository(database.db, admin.ownerId);
      const baseline = JSON.parse(readFileSync("packs/releases/ifsc-week-1.pack.json", "utf8"));
      const science = JSON.parse(readFileSync("packs/drafts/ifsc-2027-science/science.pack.json", "utf8"));
      expect((await importTrackPack(baseline, importer)).status).toBe("imported");
      expect((await importTrackPack(science, importer)).status).toBe("imported");
      const repo = new ContentQaRepository(database.db);
      const targets = science.track.modules.flatMap((trackModule: { lessons: { id: string; version: number }[] }) => trackModule.lessons.map(lesson => ({ lessonId: lesson.id, version: lesson.version })));
      const before = await database.db.select().from(questionVersions);
      const releasesBefore = await repo.list();
      const result = await repo.publishLessonsDirect(admin, { lessons: targets, reason });
      expect(result).toEqual({ published: true, lessons: 40, releases: 360, newlyPublished: 360 });
      const queue = (await repo.lessonQueue()).filter(item => targets.some((t: typeof target) => t.lessonId === item.lesson.id && t.version === item.lesson.version));
      expect(queue).toHaveLength(40);
      expect(queue.every(item => item.release?.status === "published" && item.questions.length === 8 && item.questions.every(q => q.release?.status === "published"))).toBe(true);
      expect(await database.db.select().from(contentQaReviews)).toEqual([]);
      const events = await database.db.select().from(contentPublicationEvents);
      expect(events).toHaveLength(360);
      expect(events.every(event => event.actorId === admin.ownerId && event.reason === reason && event.mode === "admin_direct")).toBe(true);
      const after = await database.db.select().from(questionVersions);
      for (const row of before) {
        const current = after.find(item => item.id === row.id)!;
        expect(current.content).toEqual(row.content);
        expect(current.contentHash).toBe(row.contentHash);
      }
      const releasesAfter = await repo.list();
      for (const release of releasesBefore.filter(row => !targets.some((t: typeof target) => row.targetType === "lesson" && row.stableId === t.lessonId) && !science.questions.some((q: { id: string }) => row.targetType === "question" && row.stableId === q.id))) {
        expect(releasesAfter.find(row => row.id === release.id)).toEqual(release);
      }
      expect((await repo.publishLessonsDirect(admin, { lessons: targets, reason })).newlyPublished).toBe(0);
      expect(await database.db.select().from(contentPublicationEvents)).toEqual(events);
      for (const table of [attempts, studyEvents, conceptEvidence]) expect(await database.db.select().from(table)).toEqual([]);
    } finally { await database.close(); }
  }, 120000);

  it("rolls back the whole batch, questions and audit when a lesson fails technical validation", async () => {
    const database = await createMigratedPgliteTestDatabase();
    try {
      expect((await importTrackPack(structuredClone(source), new DrizzleTrackImportRepository(database.db, "owner"))).status).toBe("imported");
      const repo = new ContentQaRepository(database.db);
      const [lesson] = await database.db.select().from(lessons).where(eq(lessons.stableId, "CIE-06"));
      await database.db.update(lessons).set({ metadata: { ...lesson.metadata as object, exitTicketQuestionIds: ["MISSING-EXIT-TICKET"] } }).where(eq(lessons.id, lesson.id));
      const releasesBefore = await repo.list();
      const questionsBefore = await database.db.select().from(questionVersions);
      await expect(repo.publishLessonsDirect(admin, { lessons: [target, { lessonId: "CIE-06", version: 1 }], reason })).rejects.toThrow("Exit ticket not published");
      expect(await repo.list()).toEqual(releasesBefore);
      expect(await database.db.select().from(questionVersions)).toEqual(questionsBefore);
      expect(await database.db.select().from(contentPublicationEvents)).toEqual([]);
      expect(await database.db.select().from(contentQaReviews)).toEqual([]);
    } finally { await database.close(); }
  }, 60000);

  it("rejects students, missing versions and retired bundles; the reviewed publication gate still applies", async () => {
    const database = await createMigratedPgliteTestDatabase();
    try {
      await importTrackPack(structuredClone(source), new DrizzleTrackImportRepository(database.db, "owner"));
      const repo = new ContentQaRepository(database.db);
      await expect(repo.publishLessonsDirect({ ownerId: "student", role: "STUDENT" }, { lessons: [target], reason })).rejects.toThrow("Access denied");
      await expect(repo.publishLessonsDirect(admin, { lessons: [{ ...target, version: 999 }], reason })).rejects.toThrow("Lesson version not found");
      const release = (await repo.list()).find(row => row.targetType === "lesson" && row.stableId === target.lessonId)!;
      await expect(repo.publish(release.id)).rejects.toThrow("QA blocks");
      await repo.retire(release.id);
      await expect(repo.publishLessonsDirect(admin, { lessons: [target], reason })).rejects.toThrow("Retired version");
      expect(await database.db.select().from(contentPublicationEvents)).toEqual([]);
      expect((await repo.list()).every(row => row.status !== "published")).toBe(true);
    } finally { await database.close(); }
  }, 60000);

  it("keeps reserved Questions closed to training after direct publication", async () => {
    const database = await createMigratedPgliteTestDatabase();
    try {
      const fixture = trackPackV2Schema.parse(structuredClone(source));
      const reserved = fixture.questions[0];
      const selected = fixture.track.modules.flatMap(trackModule => trackModule.lessons).find(lesson => lesson.activities.some(activity => activity.questionId === reserved.id))!;
      Object.assign(reserved, { exposurePolicy: { ...reserved.exposurePolicy, reservedForAssessment: true, unlockAt: "2099-01-01T00:00:00.000Z" } });
      for (const trackModule of fixture.track.modules) for (const lesson of trackModule.lessons) {
        lesson.activities = lesson.activities.filter(activity => activity.questionId !== reserved.id);
        lesson.exitTicketQuestionIds = lesson.exitTicketQuestionIds.filter(id => id !== reserved.id);
      }
      expect((await importTrackPack(fixture, new DrizzleTrackImportRepository(database.db, "owner"))).status).toBe("imported");
      const repo = new ContentQaRepository(database.db);
      await repo.publishLessonsDirect(admin, { lessons: [{ lessonId: selected.id, version: selected.version }], reason });
      const bank = await new DrizzleQuestionRepository(database.db).getVersion(reserved.id, reserved.version);
      expect(bank?.question.status).toBe("draft");
      expect(bank?.question.exposurePolicy).toEqual(reserved.exposurePolicy);
      expect(canExposeQuestion(bank!.question, { now: new Date("2026-10-05"), context: "training" })).toBe(false);
      expect(await database.db.select().from(contentQaReviews)).toEqual([]);
    } finally { await database.close(); }
  }, 60000);

  it("requires explicit unique versions, a reason and a bounded batch", () => {
    expect(directPublicationSchema.safeParse({ lessons: [target], reason }).success).toBe(true);
    for (const input of [
      { lessons: [target], reason: "" },
      { lessons: [{ lessonId: "POR-01" }], reason },
      { lessons: [target, { ...target, version: 2 }], reason },
      { lessons: Array.from({ length: 41 }, (_, index) => ({ lessonId: `L-${index}`, version: 1 })), reason },
      { lessons: [target], reason, actorId: "spoofed" }
    ]) expect(directPublicationSchema.safeParse(input).success).toBe(false);
  });
});
