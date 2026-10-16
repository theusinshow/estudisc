import { afterEach, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { activities, lessons, questionVersions, questions } from "@/db/schema";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { importLessonVersion } from "@/features/import/application/lesson-version-policy";
import { questionSchema } from "@/features/questions/contracts";
import { evaluateQuestion } from "@/features/questions/evaluation";
import { appendInteractions, interactionAuthoringSchema } from "../../tools/estudisc-content-studio/interaction-batch";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

let fixtureDb: Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>> | undefined;
afterEach(async () => { await fixtureDb?.close(); fixtureDb = undefined; });

it("appends ordering, classification and matching Questions to a published lesson and publishes them", async () => {
  const { context, base } = lessonVersionFixture();
  fixtureDb = await createMigratedPgliteTestDatabase();
  const db = fixtureDb.db, repo = new DrizzleTrackImportRepository(db as never, "fixture-admin"), qa = new ContentQaRepository(db as never);
  await repo.applyTrackPack(context, hashCanonicalJson(context));
  const admin = { ownerId: "fixture-admin", role: "ADMIN" as const };
  await qa.publishLessonsDirect(admin, { lessons: [{ lessonId: base.id, version: base.version }], reason: "Disposable fixture: actual Admin Direct path, no editorial approvals fabricated." });

  const conceptId = base.concepts[0].id;
  const common = { lessonId: base.id, conceptId, difficulty: "direct", explanation: "Explicação curta que justifica a resposta esperada." };
  const authored = [
    { ...common, type: "ordering", stem: "Ordene as etapas do procedimento.", items: ["Ler o enunciado", "Montar a conta", "Conferir o resultado"] },
    { ...common, type: "classification", stem: "Classifique cada número.", items: ["2", "9", "15"], destinations: ["Primo", "Composto"], answer: { "2": "Primo", "9": "Composto", "15": "Composto" } },
    { ...common, type: "matching", stem: "Relacione cada operação ao resultado.", items: ["2 + 2", "3 × 3", "10 − 5"], destinations: ["4", "9", "5"], answer: { "2 + 2": "4", "3 × 3": "9", "10 − 5": "5" } }
  ].map(entry => interactionAuthoringSchema.parse(entry));
  const moduleId = context.track.modules.find(module => module.lessons.some(lesson => lesson.id === base.id))!.id;
  const pack = appendInteractions({ context, moduleId, base, authored, packId: "estudisc.interactions.integration", authorId: "fixture-admin", generationRunId: "interaction-test" });

  expect((await importLessonVersion(pack, repo, true)).status).toBe("ready");
  expect((await importLessonVersion(pack, repo)).status).toBe("imported");
  await qa.publishLessonsDirect(admin, { lessons: [{ lessonId: base.id, version: pack.lesson.version }], reason: "Disposable fixture: publish appended interactions via Admin Direct." });

  const [lessonRow] = await db.select().from(lessons).where(and(eq(lessons.stableId, base.id), eq(lessons.contentVersion, pack.lesson.version)));
  const appended = (await db.select().from(activities).where(eq(activities.lessonId, lessonRow.id))).filter(row => row.stableId.includes("-INT-ACT"));
  expect(appended.map(row => row.stableId).sort()).toEqual([`${base.id}-INT-ACT01`, `${base.id}-INT-ACT02`, `${base.id}-INT-ACT03`]);
  for (const kind of ["ordering", "classification", "matching"]) {
    const id = pack.questionVersions!.find(question => question.type === kind)!.id;
    const [row] = await db.select({ status: questionVersions.status, content: questionVersions.content }).from(questionVersions).innerJoin(questions, eq(questions.id, questionVersions.questionId)).where(and(eq(questions.stableId, id), eq(questionVersions.version, 1)));
    expect(row.status).toBe("published");
    const question = questionSchema.parse({ ...(row.content as object), status: "published" });
    const right = question.answer.kind === "ordering" ? question.answer.orderedIds : question.answer.kind === "classification" ? question.answer.assignments : question.answer.kind === "matching" ? question.answer.pairs : null;
    expect(evaluateQuestion(question, right).correct).toBe(true);
  }
});
