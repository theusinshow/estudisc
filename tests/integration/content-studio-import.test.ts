// @vitest-environment node
import { expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
import { Studio } from "../../tools/estudisc-content-studio/workspace";
import { runDemo } from "../../tools/estudisc-content-studio/demo";
import { readJson } from "../../tools/estudisc-content-studio/validation";
import { importTrackPack } from "@/features/import/application/track-import-service";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { DrizzleQuestionRepository } from "@/db/repositories/question-repository";
import { lessons, contentReleases, contentQaReviews, attempts, tracks, contentBlocks } from "@/db/schema";

it("imports the Studio export through the real repository into disposable PGlite, retaining draft releases and zero student events", async () => {
  const root = resolve(process.cwd()); mkdirSync(join(root, ".local"), { recursive: true });
  const workspace = mkdtempSync(join(root, ".local/studio-integration-"));
  const database = await createMigratedPgliteTestDatabase();
  try {
    const studio = new Studio(root, workspace); runDemo(studio, true);
    const pack = readJson(join(studio.dir("CIE-06"), "approved/pack.json"));
    const repository = new DrizzleTrackImportRepository(database.db, "disposable-demo-importer");
    expect((await importTrackPack(pack, repository)).status).toBe("imported");
    expect((await importTrackPack(pack, repository)).status).toBe("already_imported");
    const importedLessons = await database.db.select().from(lessons);
    expect(importedLessons).toHaveLength(1);
    expect((importedLessons[0].metadata as { status: string }).status).toBe("draft");
    expect((await new DrizzleQuestionRepository(database.db).getVersion("Q-CIE-06-DEMO", 1))?.question.status).toBe("draft");
    const releases = await database.db.select().from(contentReleases);
    expect(releases).toHaveLength(3); expect(releases.every(r => r.status === "draft")).toBe(true);
    expect(releases.find(r => r.targetType === "lesson")?.authorId).toBe("ai:studio-CIE-06-v2");
    expect(await database.db.select().from(contentQaReviews)).toHaveLength(0);
    expect(await database.db.select().from(attempts)).toHaveLength(0);
    const [track] = await database.db.select().from(tracks);
    expect(track.stableId).toBe("studio-CIE-06");
    const [block] = await database.db.select().from(contentBlocks);
    expect((block.payload as { contentStudio: { sourceIds: string[] } }).contentStudio.sourceIds).toEqual(["src-demo-spec"]);
  } finally {
    await database.close();
    if (!workspace.startsWith(join(root, ".local"))) throw new Error("Unsafe cleanup target");
    rmSync(workspace, { recursive: true, force: true });
  }
}, 30000);
