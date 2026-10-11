import { afterEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { contentReleases, questionVersions, questions } from "@/db/schema";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { MemoryTrackImportRepository } from "@/db/repositories/memory-store";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { importLessonVersion, resolveAssessedLessonVersionContext } from "@/features/import/application/lesson-version-policy";
import { assessedLessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

function assessedFixture(published = false) {
  const fixture = lessonVersionFixture(published);
  const conceptId = fixture.base.concepts[0]!.id;
  const question = {
    id: "Q-FIXTURE-CIRCLE-RECALL-01", version: 1, subjectCode: "MAT", primaryConceptId: conceptId, conceptIds: [conceptId],
    type: "numeric" as const, difficulty: "direct" as const, cognitiveOperations: ["calculate" as const],
    stem: "Usando π aproximadamente 3,14, qual é o comprimento de uma circunferência de raio 5 cm?",
    answer: { kind: "numeric" as const, value: 31.4, tolerance: 0.01, unit: "cm" }, explanation: "C = 2πr; portanto, 2 × 3,14 × 5 = 31,4 cm.",
    sourceIds: [fixture.base.sourceIds[0] ?? fixture.context.sources[0]!.id], assets: [], items: [], destinations: [],
    provenance: { type: "generated" as const, generationRunId: "fixture-circle-retrieval" },
    exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "draft" as const
  };
  const packet = assessedLessonVersionPackSchema.parse({
    ...fixture.packet, schema: "caderno.lesson.v3", packId: "fixture.assessed-circle-v5",
    lesson: { ...fixture.packet.lesson, activities: [...fixture.packet.lesson.activities, { id: "ACT-FIXTURE-CIRCLE-RECALL-01", type: "question", conceptIds: [conceptId], prompt: "Calcule o comprimento da circunferência.", questionId: question.id, config: { hints: ["Use C = 2πr."] } }] },
    questionReferences: [...fixture.packet.questionReferences, { id: question.id, version: question.version, hash: hashCanonicalJson(question) }], newQuestions: [question]
  });
  return { ...fixture, packet, question };
}

describe("targeted assessed Question append", () => {
  let fixtureDb: Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>> | undefined;
  afterEach(async () => { await fixtureDb?.close(); fixtureDb = undefined; });
  async function setup() {
    const data = assessedFixture(); fixtureDb = await createMigratedPgliteTestDatabase();
    const db = fixtureDb.db, repo = new DrizzleTrackImportRepository(db as never, "fixture-admin");
    await repo.applyTrackPack(data.context, hashCanonicalJson(data.context));
    const qa = new ContentQaRepository(db as never);
    await qa.publishLessonsDirect({ ownerId: "fixture-admin", role: "ADMIN" }, { lessons: [{ lessonId: data.base.id, version: data.base.version }], reason: "Disposable base publication for assessed append compatibility." });
    return { ...data, db, repo, qa };
  }

  it("appends a draft shared Question and binding atomically, then publishes through the existing direct bundle", async () => {
    const { db, repo, qa, packet, base, question } = await setup();
    const before = await db.select().from(questionVersions);
    expect((await importLessonVersion(packet, repo, true)).status).toBe("ready");
    expect(await db.select().from(questions).where(eq(questions.stableId, question.id))).toEqual([]);
    expect((await importLessonVersion(packet, repo)).status).toBe("imported");
    expect((await importLessonVersion(packet, repo)).status).toBe("already_imported");
    const [stored] = await db.select().from(questionVersions).innerJoin(questions, eq(questions.id, questionVersions.questionId)).where(eq(questions.stableId, question.id));
    expect(stored.question_versions.status).toBe("draft");
    expect((await db.select().from(questionVersions)).filter(row => row.id !== stored.question_versions.id)).toEqual(before);
    const releases = await db.select().from(contentReleases);
    expect(releases.find(release => release.targetType === "question" && release.stableId === question.id)?.authorId).toBe("ai:fixture-circle-retrieval");
    await qa.publishLessonsDirect({ ownerId: "fixture-admin", role: "ADMIN" }, { lessons: [{ lessonId: base.id, version: 5 }], reason: "Disposable Admin Direct assessed-retrieval publication fixture." });
    const [published] = await db.select().from(questionVersions).where(eq(questionVersions.id, stored.question_versions.id));
    expect(published.status).toBe("published");
  });

  it("rejects source mutation, reserved content and forged new-question references before any write", () => {
    const { context, packet } = assessedFixture();
    const changed = structuredClone(packet); changed.lesson.activities[0]!.prompt += " changed";
    const reserved = structuredClone(packet); reserved.newQuestions[0]!.exposurePolicy.reservedForAssessment = true;
    const forged = structuredClone(packet); forged.questionReferences.at(-1)!.hash = "0".repeat(64);
    for (const input of [changed, reserved, forged]) expect(() => resolveAssessedLessonVersionContext([context], input)).toThrow();
  });

  it("rolls back the receipt and new Question when an append write fails", async () => {
    const { db, repo, packet, question } = await setup();
    await db.execute(sql`create function reject_assessed_append_activity() returns trigger language plpgsql as $$ begin if NEW.stable_id='ACT-FIXTURE-CIRCLE-RECALL-01' then raise exception 'synthetic assessed append failure'; end if; return NEW; end $$`);
    await db.execute(sql`create trigger reject_assessed_append before insert on activities for each row execute function reject_assessed_append_activity()`);
    await expect(importLessonVersion(packet, repo)).rejects.toThrow();
    expect(await db.select().from(questions).where(eq(questions.stableId, question.id))).toEqual([]);
    await db.execute(sql`drop trigger reject_assessed_append on activities`);
  });

  it("shares the v3 preservation and idempotence policy with the memory harness", async () => {
    const { context, packet, question } = assessedFixture(true), store = structuredClone(getMemoryStore());
    const repo = new MemoryTrackImportRepository(store); await repo.applyTrackPack(context, hashCanonicalJson(context));
    expect((await importLessonVersion(packet, repo)).status).toBe("imported");
    expect((await importLessonVersion(packet, repo)).status).toBe("already_imported");
    const projection = trackPackV2Schema.parse(store.packImports.at(-1)!.manifest);
    expect(projection.questions.find(candidate => candidate.id === question.id)?.version).toBe(1);
    expect(projection.track.modules.flatMap(module => module.lessons).find(lesson => lesson.id === packet.lesson.id && lesson.version === packet.lesson.version)?.activities.at(-1)?.questionId).toBe(question.id);
  });
});
