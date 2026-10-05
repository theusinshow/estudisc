// @vitest-environment node
import { expect, it } from "vitest";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { importTrackPack } from "@/features/import/api";
import { attempts, conceptEvidence, contentPublicationEvents, contentQaReviews, questionVersions, studyEvents } from "@/db/schema";
import { readJson } from "../../tools/science-import/mapper";
import { reviewedGhRelease, REVIEW_REASON } from "../../tools/gh-import/reviewed-release";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

it("publishes the reviewed GH snapshot in 40+9 batches with 441 audit records and unchanged baseline/content/state", async () => {
  const { pack, batches } = reviewedGhRelease();
  const database = await createMigratedPgliteTestDatabase();
  try {
    const admin = { ownerId: "gh-publication-disposable-test", role: "ADMIN" as const };
    const importer = new DrizzleTrackImportRepository(database.db, admin.ownerId);
    expect((await importTrackPack(readJson("packs/releases/ifsc-week-1.pack.json"), importer)).status).toBe("imported");
    expect((await importTrackPack(pack, importer)).status).toBe("imported");
    const qa = new ContentQaRepository(database.db); const baseline = await qa.list();
    const before = await database.db.select().from(questionVersions);
    for (const [index, batch] of batches.entries()) {
      const input = { lessons: batch.lessons, reason: batch.reason };
      expect(await qa.publishLessonsDirect(admin, input)).toEqual({ published: true, lessons: index === 0 ? 40 : 9, releases: index === 0 ? 360 : 81, newlyPublished: index === 0 ? 360 : 81 });
      expect((await qa.publishLessonsDirect(admin, input)).newlyPublished).toBe(0);
    }
    const queue = (await qa.lessonQueue()).filter(row => row.lesson.id.startsWith("GH-V2-"));
    expect(queue).toHaveLength(49);
    expect(queue.every(row => row.release?.status === "published" && row.questions.length === 8 && row.questions.every(q => q.release?.status === "published"))).toBe(true);
    const after = await database.db.select().from(questionVersions);
    for (const original of before) { const current = after.find(row => row.id === original.id)!; expect(current.content).toEqual(original.content); expect(current.contentHash).toBe(original.contentHash); }
    const releases = await qa.list();
    for (const original of baseline.filter(row => !row.stableId.startsWith("GH-V2-"))) expect(releases.find(row => row.id === original.id)).toEqual(original);
    const events = await database.db.select().from(contentPublicationEvents);
    expect(events).toHaveLength(441); expect(events.every(e => e.actorId === admin.ownerId && e.reason === REVIEW_REASON)).toBe(true);
    for (const table of [contentQaReviews, attempts, studyEvents, conceptEvidence]) expect(await database.db.select().from(table)).toEqual([]);
  } finally { await database.close(); }
}, 120000);
