import examplePack from "../../packs/examples/javascript-fundamentals.track.json";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActivityAttemptRepository } from "@/db/repositories/activity-attempt-repository";
import { ProgressRepository } from "@/db/repositories/progress-repository";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { attempts, conceptEvidence } from "@/db/schema";
import { submitCodeActivity } from "@/features/activities/api";
import { importTrackPack } from "@/features/import/api";

import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

type TestDb = Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>>;

const passingSource =
  "const documentExists = true;\nconst userAuthorized = false;\nconst canOpen = documentExists && userAuthorized;\nconsole.log(canOpen);";

describe("ProgressRepository", () => {
  let testDb: TestDb | undefined;

  afterEach(async () => {
    vi.unstubAllEnvs();
    await testDb?.close();
    testDb = undefined;
  });

  it("derives lesson and track progress from append-only attempts without calculating mastery", async () => {
    vi.stubEnv("KNOW_OS_OWNER_ID", "local-owner");
    testDb = await createImportedSlice();
    const progressRepository = new ProgressRepository(testDb.db as never);
    const attemptRepository = new ActivityAttemptRepository(testDb.db as never);

    await expect(progressRepository.getLessonProgress("local-owner", "js-fundamentals-001")).resolves.toMatchObject(
      {
        totalActivities: 2,
        attemptedActivities: 0,
        passedActivities: 0,
        masteryStatus: "not_calculated"
      }
    );

    await submitCodeActivity("js-logical-and-code-001", passingSource, attemptRepository);

    await expect(progressRepository.getLessonProgress("local-owner", "js-fundamentals-001")).resolves.toMatchObject(
      {
        totalActivities: 2,
        attemptedActivities: 1,
        passedActivities: 1,
        masteryStatus: "not_calculated"
      }
    );
    await expect(progressRepository.getTrackProgress("local-owner", "javascript")).resolves.toMatchObject(
      {
        totalLessons: 1,
        completedLessons: 0,
        completedLessonStableIds: [],
        totalActivities: 2,
        attemptedActivities: 1,
        passedActivities: 1,
        masteryStatus: "not_calculated"
      }
    );
    await expect(progressRepository.getLessonProgress("local-owner", "missing-lesson")).resolves.toBeNull();
  });

  it.each(["older-first", "newer-first"] as const)(
    "counts the current lesson version while preserving history (%s)",
    async (importOrder) => {
      vi.stubEnv("KNOW_OS_OWNER_ID", "local-owner");
      testDb = await createMigratedPgliteTestDatabase();
      const latestPack = structuredClone(examplePack);
      latestPack.packId += ".current";
      latestPack.version = 2;
      latestPack.track.id = "javascript-current";
      const latestLesson = latestPack.track.modules[0].lessons[0];
      latestLesson.version = 2;
      latestLesson.activities.forEach((activity) => { activity.id += "-v2"; });
      latestLesson.activities.push({ ...structuredClone(latestLesson.activities[1]), id: "js-number-debug-extra-v2" });
      const importRepository = new DrizzleTrackImportRepository(testDb.db as never);
      for (const pack of importOrder === "older-first" ? [examplePack, latestPack] : [latestPack, examplePack]) {
        await expect(importTrackPack(pack, importRepository)).resolves.toMatchObject({ status: "imported" });
      }
      const attemptRepository = new ActivityAttemptRepository(testDb.db as never);
      const progressRepository = new ProgressRepository(testDb.db as never);
      await submitCodeActivity("js-logical-and-code-001", passingSource, attemptRepository);
      const historicalAttempts = await testDb.db.select().from(attempts);
      const historicalEvidence = await testDb.db.select().from(conceptEvidence);
      expect(historicalAttempts).toHaveLength(1);

      await expect(progressRepository.getLessonProgress("local-owner", "js-fundamentals-001")).resolves.toMatchObject({
        totalActivities: 3, attemptedActivities: 0, passedActivities: 0, masteryStatus: "not_calculated"
      });
      await submitCodeActivity("js-logical-and-code-001-v2", passingSource, attemptRepository);
      await expect(progressRepository.getLessonProgress("local-owner", "js-fundamentals-001")).resolves.toMatchObject({
        totalActivities: 3, attemptedActivities: 1, passedActivities: 1, masteryStatus: "not_calculated"
      });
      await expect(progressRepository.getLessonProgress("other-owner", "js-fundamentals-001")).resolves.toMatchObject({
        totalActivities: 3, attemptedActivities: 0, passedActivities: 0
      });
      await expect(progressRepository.getTrackProgress("local-owner", "javascript-current")).resolves.toMatchObject({
        totalActivities: 3, attemptedActivities: 1, passedActivities: 1, completedLessons: 0
      });
      await expect(progressRepository.getTrackProgress("local-owner", "javascript")).resolves.toMatchObject({
        totalActivities: 2, attemptedActivities: 1, passedActivities: 1, completedLessons: 0
      });
      const currentAttempts = await testDb.db.select().from(attempts);
      const currentEvidence = await testDb.db.select().from(conceptEvidence);
      expect(currentAttempts).toHaveLength(2);
      expect(currentAttempts).toEqual(expect.arrayContaining(historicalAttempts));
      expect(currentEvidence).toEqual(expect.arrayContaining(historicalEvidence));
    }
  );
});

async function createImportedSlice() {
  const testDb = await createMigratedPgliteTestDatabase();
  const importRepository = new DrizzleTrackImportRepository(testDb.db as never);
  await importTrackPack(examplePack, importRepository);
  return testDb;
}
