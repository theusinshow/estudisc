import { describe, expect, it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { MemoryTrackImportRepository, getMemoryStore } from "@/db/repositories/memory-store";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { MemoryQuestionStudyRepository } from "@/db/repositories/memory-question-study-repository";
import { QuestionStudyRepository } from "@/db/repositories/question-study-repository";
import { xpTransactions } from "@/db/schema";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
import { simulatePublication } from "./ifsc-publication-fixture";

describe.each(["memory", "persistent"] as const)("Question rewards (%s)", storeKind => {
  it("awards once atomically, isolates owners, and excludes failures, hints and solutions", async () => {
    const database = storeKind === "persistent" ? await createMigratedPgliteTestDatabase() : undefined;
    // Isolated disposable store, without resetting any shared development process.
    const store: ReturnType<typeof getMemoryStore> = {
      questionAssets: [], assessmentTemplates: [], assessmentInstances: [], assessmentResponses: [],
      questionAssistance: [], questionExposures: [], studySessions: [], packImports: [], tracks: [],
      modules: [], lessons: [], concepts: [], blocks: [], activities: [], attempts: [], conceptEvidence: [],
      reviewSchedules: [], mistakes: [], projects: [], xpTransactions: [], badgeAwards: [],
      missionProgress: [], missionProgressEvents: [], events: [], lessonProgressCount: 0, trackProgressCount: 0
    };
    try {
      const fixture = structuredClone(source);
      fixture.questions.forEach(question => { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; });
      fixture.track.modules.forEach(moduleDefinition => moduleDefinition.lessons.forEach(lesson => { lesson.status = "published"; }));
      expect((await importTrackPack(fixture, database ? new DrizzleTrackImportRepository(database.db) : new MemoryTrackImportRepository(store))).status).toBe("imported");
      if (database) await simulatePublication(database.db);
      const repository = database ? new QuestionStudyRepository(database.db) : new MemoryQuestionStudyRepository(store);
      const ledger = () => database ? database.db.select().from(xpTransactions) : Promise.resolve(store.xpTransactions);
      const input = { questionId: "Q-MAT-GOLDEN-3", questionVersion: 1, action: "submit" as const, submissionKey: crypto.randomUUID(), response: "30" };

      await repository.view("learner", "mat07-q3", input.questionId, 1);
      expect(await ledger()).toHaveLength(0); // Opening content does not award XP.
      expect(await repository.interact("learner", "mat07-q3", { ...input, response: "29" })).toMatchObject({ correct: false, xpAwarded: 0 });
      const results = await Promise.all([1, 2].map(() => repository.interact("learner", "mat07-q3", { ...input, submissionKey: crypto.randomUUID() })));
      expect(results.map(result => result.xpAwarded).sort()).toEqual([0, 20]);
      const replayKey = crypto.randomUUID();
      const retry = await repository.interact("learner", "mat07-q3", { ...input, submissionKey: replayKey });
      expect(retry).toMatchObject({ correct: true, xpAwarded: 0 });
      expect(await repository.interact("learner", "mat07-q3", { ...input, submissionKey: replayKey })).toEqual(retry);
      expect(await ledger()).toHaveLength(1);

      for (const action of ["hint", "solution"] as const) {
        const owner = `assisted-${action}`;
        await repository.view(owner, "mat07-q3", input.questionId, 1);
        await repository.interact(owner, "mat07-q3", { ...input, action, submissionKey: crypto.randomUUID() });
        expect(await repository.interact(owner, "mat07-q3", { ...input, submissionKey: crypto.randomUUID() })).toMatchObject({ correct: true, xpAwarded: 0 });
      }
      await repository.view("other-learner", "mat07-q3", input.questionId, 1);
      expect(await repository.interact("other-learner", "mat07-q3", input)).toMatchObject({ correct: true, xpAwarded: 20 });
      expect(await ledger()).toMatchObject([
        { ownerId: "learner", amount: 20, reason: "question_independent_success", sourceType: "question", sourceId: input.questionId },
        { ownerId: "other-learner", amount: 20, sourceType: "question", sourceId: input.questionId }
      ]);
    } finally { await database?.close(); }
  });
});
