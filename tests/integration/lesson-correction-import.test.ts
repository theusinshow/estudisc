import { afterEach, expect, it } from "vitest";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { CatalogRepository } from "@/db/repositories/catalog-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { importLessonVersion } from "@/features/import/application/lesson-version-policy";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { validateTrackPack } from "@/features/import/api";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

let fixtureDb: Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>> | undefined;
afterEach(async () => { await fixtureDb?.close(); fixtureDb = undefined; });

it("imports a correction version over the published lesson and publishes it through Admin Direct", async () => {
  const { context, base, packet } = lessonVersionFixture();
  fixtureDb = await createMigratedPgliteTestDatabase();
  const db = fixtureDb.db, repo = new DrizzleTrackImportRepository(db as never, "fixture-admin"), qa = new ContentQaRepository(db as never);
  expect(validateTrackPack(context).ok).toBe(true);
  await repo.applyTrackPack(context, hashCanonicalJson(context));
  const admin = { ownerId: "fixture-admin", role: "ADMIN" as const };
  await qa.publishLessonsDirect(admin, { lessons: [{ lessonId: base.id, version: base.version }], reason: "Disposable fixture: actual Admin Direct path, no editorial approvals fabricated." });

  const lesson = structuredClone({ ...base, version: base.version + 1, status: "draft" as const });
  const target = lesson.blocks.find(block => typeof block.payload.content === "string" && ["note", "text", "summary", "worked-example"].includes(block.type))!;
  const oldHash = hashCanonicalJson(base.blocks.find(block => block.id === target.id));
  target.payload = { ...target.payload, content: "Conteúdo corrigido para o aluno." };
  const correction = lessonVersionPackSchema.parse({ ...packet, packId: "estudisc.correction.integration", lesson,
    corrections: { reason: "Remove internal editorial text visible to students", blocks: [{ blockId: target.id, action: "replace", baseBlockHash: oldHash }] } });

  expect((await importLessonVersion(correction, repo, true)).status).toBe("ready");
  expect((await importLessonVersion(correction, repo)).status).toBe("imported");
  const catalog = new CatalogRepository(db as never);
  const publishedBefore = await catalog.getLesson(base.id, undefined, undefined, true);
  expect(publishedBefore?.blocks.find(block => block.stableId === target.id)?.payload).not.toMatchObject({ content: "Conteúdo corrigido para o aluno." });

  await qa.publishLessonsDirect(admin, { lessons: [{ lessonId: base.id, version: base.version + 1 }], reason: "Disposable fixture: publish the correction version via Admin Direct." });
  const published = await catalog.getLesson(base.id, undefined, undefined, true);
  expect(published?.blocks.find(block => block.stableId === target.id)?.payload).toMatchObject({ content: "Conteúdo corrigido para o aluno." });
  expect(published?.blocks).toHaveLength(base.blocks.length);
  expect((await catalog.getLesson(base.id, base.version, undefined, true))?.blocks.find(block => block.stableId === target.id)?.payload).not.toMatchObject({ content: "Conteúdo corrigido para o aluno." });
});
