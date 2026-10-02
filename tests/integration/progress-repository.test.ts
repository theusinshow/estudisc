import examplePack from "../../packs/examples/javascript-fundamentals.track.json";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActivityAttemptRepository } from "@/db/repositories/activity-attempt-repository";
import { ProgressRepository } from "@/db/repositories/progress-repository";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
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
  });
});

async function createImportedSlice() {
  const testDb = await createMigratedPgliteTestDatabase();
  const importRepository = new DrizzleTrackImportRepository(testDb.db as never);
  await importTrackPack(examplePack, importRepository);
  return testDb;
}
