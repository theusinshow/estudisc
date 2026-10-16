import { afterEach, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { activities, lessons, questionVersions, questions } from "@/db/schema";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { importLessonVersion } from "@/features/import/application/lesson-version-policy";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { validateTrackPack } from "@/features/import/api";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

let fixtureDb: Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>> | undefined;
afterEach(async () => { await fixtureDb?.close(); fixtureDb = undefined; });

it("imports and publishes lesson-bound Question versions without moving the published version", async () => {
  const { context, base, packet } = lessonVersionFixture();
  fixtureDb = await createMigratedPgliteTestDatabase();
  const db = fixtureDb.db, repo = new DrizzleTrackImportRepository(db as never, "fixture-admin"), qa = new ContentQaRepository(db as never);
  expect(validateTrackPack(context).ok).toBe(true);
  await repo.applyTrackPack(context, hashCanonicalJson(context));
  const admin = { ownerId: "fixture-admin", role: "ADMIN" as const };
  await qa.publishLessonsDirect(admin, { lessons: [{ lessonId: base.id, version: base.version }], reason: "Disposable fixture: actual Admin Direct path, no editorial approvals fabricated." });

  const lesson = structuredClone({ ...base, version: base.version + 1, status: "draft" as const });
  const activity = lesson.activities.find(entry => entry.type === "question")!;
  const old = context.questions.find(q => q.id === activity.questionId)!;
  const bumped = { ...structuredClone(old), version: old.version + 1, status: "draft" as const, choices: [...(old.choices ?? [])].reverse() };
  activity.config = { ...activity.config, questionVersion: bumped.version };
  const fresh = { ...structuredClone(old), id: "Q-BINDING-NEW-1", version: 1, status: "draft" as const };
  lesson.activities.push({ ...structuredClone(activity), id: "ACT-BINDING-NEW-1", questionId: fresh.id, config: { ...activity.config, questionVersion: 1 } });
  const all = [...context.questions.filter(q => q.id !== old.id), bumped, fresh];
  const ids = [...new Set([...lesson.exitTicketQuestionIds, ...lesson.activities.flatMap(a => a.questionId ? [a.questionId] : [])])];
  const pack = lessonVersionPackSchema.parse({ ...packet, packId: "estudisc.binding.integration", lesson, questionVersions: [bumped, fresh],
    questionReferences: ids.map(id => { const q = all.find(entry => entry.id === id)!; return { id, version: q.version, hash: hashCanonicalJson(q) }; }) });

  expect((await importLessonVersion(pack, repo, true)).status).toBe("ready");
  expect((await importLessonVersion(pack, repo)).status).toBe("imported");
  expect((await importLessonVersion(pack, repo)).status).toBe("already_imported");
  await qa.publishLessonsDirect(admin, { lessons: [{ lessonId: base.id, version: lesson.version }], reason: "Disposable fixture: publish lesson-bound Question versions via Admin Direct." });

  const status = async (id: string, version: number) => (await db.select({ status: questionVersions.status }).from(questionVersions).innerJoin(questions, eq(questions.id, questionVersions.questionId)).where(and(eq(questions.stableId, id), eq(questionVersions.version, version))))[0]?.status;
  expect(await status(old.id, old.version)).toBe("published");
  expect(await status(old.id, bumped.version)).toBe("published");
  expect(await status(fresh.id, 1)).toBe("published");
  const configOf = async (version: number, activityId: string) => {
    const [lessonRow] = await db.select().from(lessons).where(and(eq(lessons.stableId, base.id), eq(lessons.contentVersion, version)));
    const [row] = await db.select().from(activities).where(and(eq(activities.lessonId, lessonRow.id), eq(activities.stableId, activityId)));
    return row?.config as { questionVersion?: number } | undefined;
  };
  expect((await configOf(base.version, activity.id))?.questionVersion).toBe(old.version);
  expect((await configOf(lesson.version, activity.id))?.questionVersion).toBe(bumped.version);
  expect((await configOf(lesson.version, "ACT-BINDING-NEW-1"))?.questionVersion).toBe(1);

  // A text correction over the rebound version: carried Activities keep their stored rows.
  const correctedLesson = structuredClone({ ...pack.lesson, version: pack.lesson.version + 1, status: "draft" as const });
  const target = correctedLesson.blocks.find(block => typeof block.payload.content === "string" && ["note", "text", "summary", "worked-example"].includes(block.type))!;
  const oldHash = hashCanonicalJson(pack.lesson.blocks.find(block => block.id === target.id));
  target.payload = { ...target.payload, content: "Texto corrigido depois da troca de questão." };
  const correction = lessonVersionPackSchema.parse({ ...pack, packId: "estudisc.binding.correction", lesson: correctedLesson, questionVersions: undefined,
    target: { ...pack.target, baseVersion: pack.lesson.version, baseHash: hashCanonicalJson(pack.lesson) },
    corrections: { reason: "Correct lesson text after a Question version change", blocks: [{ blockId: target.id, action: "replace", baseBlockHash: oldHash }] } });
  expect((await importLessonVersion(correction, repo, true)).status).toBe("ready");
  expect((await importLessonVersion(correction, repo)).status).toBe("imported");
  expect((await configOf(correctedLesson.version, activity.id))?.questionVersion).toBe(bumped.version);
});
