import { afterEach, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { activities, concepts, contentSources, lessons, questionVersions, questions, trackConceptSettings } from "@/db/schema";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { CatalogRepository } from "@/db/repositories/catalog-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { StudyFlowRepository } from "@/db/repositories/study-flow-repository";
import { importNewLesson } from "@/features/import/application/new-lesson-policy";
import { validateTrackPack } from "@/features/import/api";
import { importLessonVersion } from "@/features/import/application/lesson-version-policy";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { newLessonFixture } from "../fixtures/new-lesson-import";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

let fixtureDb: Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>> | undefined;
afterEach(async () => { await fixtureDb?.close(); fixtureDb = undefined; });

it("appends a new draft lesson to a published Track, publishes it via Admin Direct and keeps earlier lessons unchanged", async () => {
  const { context, pack } = newLessonFixture();
  fixtureDb = await createMigratedPgliteTestDatabase();
  const db = fixtureDb.db, repo = new DrizzleTrackImportRepository(db as never, "fixture-admin"), qa = new ContentQaRepository(db as never);
  expect(validateTrackPack(context).ok).toBe(true);
  await repo.applyTrackPack(context, hashCanonicalJson(context));
  const admin = { ownerId: "fixture-admin", role: "ADMIN" as const };
  const published = context.track.modules[0].lessons.map(l => ({ lessonId: l.id, version: l.version }));
  await qa.publishLessonsDirect(admin, { lessons: published, reason: "Disposable fixture: actual Admin Direct path, no editorial approvals fabricated." });
  const catalog = new CatalogRepository(db as never);
  const before = await Promise.all(published.map(l => catalog.getLesson(l.lessonId, undefined, undefined, true)));

  expect((await importNewLesson(pack, repo, true)).status).toBe("ready");
  expect(await catalog.getLesson(pack.lesson.id)).toBeNull();
  expect((await importNewLesson(pack, repo)).status).toBe("imported");
  expect((await importNewLesson(pack, repo)).status).toBe("already_imported");
  await expect(importNewLesson({ ...pack, authorId: "someone-else" }, repo)).rejects.toThrow(/different content/);
  await expect(importNewLesson({ ...pack, packId: "estudisc.new-lesson.again" }, repo)).rejects.toThrow(/already exists/);
  expect(await catalog.getLesson(pack.lesson.id, undefined, undefined, true)).toBeNull();

  const [row] = await db.select().from(lessons).where(eq(lessons.stableId, pack.lesson.id));
  expect(row.metadata).toMatchObject({ status: "draft", importedBy: "fixture-admin" });
  const [lastBase] = await db.select().from(lessons).where(and(eq(lessons.stableId, context.track.modules[0].lessons.at(-1)!.id), eq(lessons.moduleId, row.moduleId)));
  expect(row.orderIndex).toBeGreaterThan(lastBase.orderIndex);
  const stored = await db.select().from(activities).where(eq(activities.lessonId, row.id));
  expect(stored).toHaveLength(pack.lesson.activities.length);
  expect(stored.every(a => a.evaluatorVersion === `caderno.track.v2:${context.version}` && (a.config as { questionVersion?: number }).questionVersion === 1)).toBe(true);
  expect(await db.select().from(concepts).where(eq(concepts.stableId, "MAT-NEW-FIX-C01"))).toHaveLength(1);
  expect(await db.select().from(trackConceptSettings).innerJoin(concepts, eq(concepts.id, trackConceptSettings.conceptId)).where(eq(concepts.stableId, "MAT-NEW-FIX-C02"))).toHaveLength(1);
  expect(await db.select().from(contentSources).where(eq(contentSources.stableId, "src-new-MAT-NEW-FIX"))).toHaveLength(1);

  await qa.publishLessonsDirect(admin, { lessons: [{ lessonId: pack.lesson.id, version: 1 }], reason: "Disposable fixture: publish the new lesson via Admin Direct." });
  const lesson = await catalog.getLesson(pack.lesson.id, undefined, undefined, true);
  expect(lesson).toMatchObject({ stableId: pack.lesson.id, trackStableId: context.track.id, metadata: { status: "published" } });
  expect(lesson?.concepts.map(c => c.stableId).sort()).toEqual(pack.lesson.concepts.map(c => c.id).sort());
  expect(lesson?.blocks.map(b => b.stableId)).toEqual(pack.lesson.blocks.map(b => b.id));
  const status = async (id: string) => (await db.select({ status: questionVersions.status }).from(questionVersions).innerJoin(questions, eq(questions.id, questionVersions.questionId)).where(and(eq(questions.stableId, id), eq(questionVersions.version, 1))))[0]?.status;
  for (const question of pack.questions) expect(await status(question.id)).toBe("published");
  const after = await Promise.all(published.map(l => catalog.getLesson(l.lessonId, undefined, undefined, true)));
  expect(after).toEqual(before);

  // The continuous study flow picks the new lesson up after the module's earlier lessons.
  const flow = (await new StudyFlowRepository(db as never).load("fixture-student")).lessons;
  const added = flow.find(l => l.id === pack.lesson.id)!;
  expect(added.questionIds).toEqual(pack.lesson.activities.map(a => a.questionId));
  expect(flow.filter(l => l.id !== added.id).every(l => l.order < added.order)).toBe(true);

  // Once published it is an ordinary base: the existing enrichment path (ADR 0062) appends its next version.
  const next = { ...structuredClone(pack.lesson), version: 2, blocks: [...structuredClone(pack.lesson.blocks), { id: "MAT-NEW-FIX-B06", type: "note" as const, schemaVersion: 1, conceptIds: ["MAT-NEW-FIX-C01"], payload: { title: "Dica", content: "Confira a quantidade de valores." } }] };
  const enrichment = lessonVersionPackSchema.parse({ schema: "caderno.lesson.v2", packId: "estudisc.new-lesson.enrich", version: 1, authorId: "fixture-author",
    target: { trackId: context.track.id, trackVersion: context.version, moduleId: "mat", lessonId: pack.lesson.id, baseVersion: 1, baseHash: hashCanonicalJson(pack.lesson) },
    lesson: next, questionReferences: pack.questions.map(q => ({ id: q.id, version: 1, hash: hashCanonicalJson(q) })) });
  expect((await importLessonVersion(enrichment, repo)).status).toBe("imported");
});
