// @vitest-environment node
import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import { SCIENCE_DRAFT_PACK } from "../tools/science-import/paths";
import { importTrackPack, trackPackV2Schema } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { attempts, conceptEvidence, contentReleases, lessonProgress, owners, questionExposures, questionVersions, studyEvents, studySessions } from "@/db/schema";
import { createMigratedPgliteTestDatabase } from "./integration/pglite-test-db";
import { jsonFile, verifySourceUnchanged } from "../tools/science-import/qa/adapted-pack-audit";
import { assertPreservation, capturePreservationSnapshot } from "../tools/science-import/qa/preservation-audit";

it("imports Science drafts without creating learners, attempts, study events or evidence and blocks publication", async () => {
  const artifact = process.env.SCIENCE_QA_PACK ?? SCIENCE_DRAFT_PACK;
  const pack = trackPackV2Schema.parse(jsonFile(artifact));
  const database = await createMigratedPgliteTestDatabase();
  try {
    const repository = new DrizzleTrackImportRepository(database.db, "science-qa-disposable");
    const baselineFiles = ["packs/releases/ifsc-week-1.pack.json"];
    // Always audit the tracked IFSC baseline; also preserve local Mathematics when available.
    const mathematics = ".local/mathematics-production/application/mathematics.pack.json";
    if (existsSync(mathematics)) baselineFiles.push(mathematics);
    for (const baselineFile of baselineFiles) expect((await importTrackPack(jsonFile(baselineFile), repository)).status).toBe("imported");
    const baseline = await capturePreservationSnapshot(database.db.$client);
    const baselineQuestions = (await database.db.select().from(questionVersions)).length;
    expect((await importTrackPack(pack, repository)).status).toBe("imported");
    const preserved = assertPreservation(baseline, await capturePreservationSnapshot(database.db.$client));
    expect(preserved.unchanged).toBe(true);
    expect(preserved.sections.sharedConcepts.count).toBe(9);
    for (const table of [owners, attempts, studyEvents, conceptEvidence, lessonProgress, questionExposures, studySessions]) expect(await database.db.select().from(table)).toHaveLength(0);
    const versions = await database.db.select().from(questionVersions);
    expect(versions).toHaveLength(pack.questions.length + baselineQuestions);
    expect(versions.every(row => row.status === "draft")).toBe(true);
    const releases = await database.db.select().from(contentReleases);
    expect(releases.length).toBeGreaterThan(0);
    expect(releases.every(row => row.status !== "published")).toBe(true);
    const qa = new ContentQaRepository(database.db);
    await expect(qa.publish(releases[0].id)).rejects.toThrow("QA blocks");
    expect(verifySourceUnchanged()).toBe(620);
  } finally { await database.close(); }
}, 30000);
