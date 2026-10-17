import examplePack from "../../packs/examples/javascript-fundamentals.track.json";
import { count } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActivityAttemptRepository } from "@/db/repositories/activity-attempt-repository";
import { ConceptEvidenceRepository } from "@/db/repositories/concept-evidence-repository";
import { ReviewRepository } from "@/db/repositories/review-repository";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { conceptEvidence, reviewSchedules, studyEvents } from "@/db/schema";
import { submitCodeActivity } from "@/features/activities/api";
import { importTrackPack } from "@/features/import/api";

import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

type TestDb = Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>>;

const passingSource =
  "const documentExists = true;\nconst userAuthorized = false;\nconst canOpen = documentExists && userAuthorized;\nconsole.log(canOpen);";

describe("ReviewRepository", () => {
  let testDb: TestDb | undefined;

  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    await testDb?.close();
    testDb = undefined;
  });

  it("selects due concepts by schedule and completion appends delayed-review evidence", async () => {
    vi.stubEnv("KNOW_OS_OWNER_ID", "local-owner");
    testDb = await createImportedSlice();
    const attemptRepository = new ActivityAttemptRepository(testDb.db as never);
    const reviewRepository = new ReviewRepository(testDb.db as never);
    const evidenceRepository = new ConceptEvidenceRepository(testDb.db as never);
    const submittedAt = new Date("2026-07-30T12:00:00.000Z");

    vi.useFakeTimers();
    vi.setSystemTime(submittedAt);
    await submitCodeActivity("js-logical-and-code-001", passingSource, attemptRepository);

    await expect(countRows(testDb.db, reviewSchedules)).resolves.toBe(1);
    await expect(reviewRepository.listDueReviews("local-owner", submittedAt)).resolves.toEqual([]);

    const dueAt = new Date("2026-07-31T12:00:01.000Z");
    await expect(reviewRepository.listDueReviews("local-owner", dueAt)).resolves.toMatchObject([
      {
        conceptStableId: "js-logical-and",
        currentMasteryState: "understood",
        recentQuality: 3,
        reason: expect.stringContaining("hora de revisar")
      }
    ]);

    const completed = await reviewRepository.completeReview({
      ownerId: "local-owner",
      conceptStableId: "js-logical-and",
      quality: 4,
      reviewedAt: dueAt
    });

    expect(completed).toMatchObject({
      conceptStableId: "js-logical-and",
      eventType: "review_completed",
      quality: 4
    });
    expect(completed?.nextReviewAt.toISOString()).toBe("2026-08-07T12:00:01.000Z");
    await expect(countRows(testDb.db, conceptEvidence)).resolves.toBe(2);
    await expect(countRows(testDb.db, studyEvents)).resolves.toBe(2);
    await expect(evidenceRepository.listForConcept("local-owner", "js-logical-and")).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "delayed_review_result",
          strength: 3,
          sourceType: "review_session",
          conditions: expect.objectContaining({
            outcome: "passed",
            quality: 4
          })
        })
      ])
    );
  });
});

async function createImportedSlice() {
  const testDb = await createMigratedPgliteTestDatabase();
  const importRepository = new DrizzleTrackImportRepository(testDb.db as never);
  await importTrackPack(examplePack, importRepository);
  return testDb;
}

async function countRows(db: TestDb["db"], table: PgTable) {
  const [row] = await db.select({ value: count() }).from(table);
  return row?.value ?? 0;
}
