import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { MemoryTrackImportRepository, getMemoryStore } from "@/db/repositories/memory-store";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { MemoryQuestionStudyRepository } from "@/db/repositories/memory-question-study-repository";
import { QuestionStudyRepository } from "@/db/repositories/question-study-repository";
import { MemoryReviewRepository } from "@/db/repositories/memory/reviews";
import { ReviewRepository } from "@/db/repositories/review-repository";
import { attempts, concepts, mistakes } from "@/db/schema";
import { BLIND_SPOT_REASON, BLIND_SPOT_SUMMARY } from "@/features/review/confidence";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
import { simulatePublication } from "./ifsc-publication-fixture";

describe.each(["memory", "persistent"] as const)("ADR 0071 confidence check (%s)", storeKind => {
  it("records confidence on the Attempt, puts blind spots first and keeps a guessed success from closing a mistake", async () => {
    const database = storeKind === "persistent" ? await createMigratedPgliteTestDatabase() : undefined;
    const store: ReturnType<typeof getMemoryStore> = {
      lessonResumes: [],
      questionAssets: [], assessmentTemplates: [], assessmentInstances: [], assessmentResponses: [], assessmentSheetResponses: [],
      questionAssistance: [], questionExposures: [], studySessions: [], studyPlans: [], studyPlanPreviews: [], packImports: [], tracks: [],
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
      const reviews = database ? new ReviewRepository(database.db) : new MemoryReviewRepository(store);
      const answer = (activity: string, questionId: string, response: string, confidence?: "sure" | "unsure" | "guess", owner = "learner") =>
        repository.interact(owner, activity, { questionId, questionVersion: 1, action: "submit", submissionKey: crypto.randomUUID(), response, ...(confidence ? { confidence } : {}) });
      await repository.view("learner", "mat07-q1", "Q-MAT-GOLDEN-1", 1);
      await repository.view("learner", "mat07-q3", "Q-MAT-GOLDEN-3", 1);

      await answer("mat07-q1", "Q-MAT-GOLDEN-1", "14");
      await answer("mat07-q3", "Q-MAT-GOLDEN-3", "29", "sure");
      const due = await reviews.listDueReviews("learner");
      expect(due[0]).toMatchObject({ conceptStableId: "MAT.PCT.CALCULATE", blindSpot: true, reason: BLIND_SPOT_REASON });
      expect(due.find(row => row.conceptStableId === "MAT.PCT.CONCEPT")).toMatchObject({ blindSpot: false, hasActiveMistake: true });
      const contexts = database ? (await database.db.select({ context: attempts.context }).from(attempts)).map(row => row.context) : store.attempts.map(row => row.context);
      expect(contexts.map(context => (context as { confidence?: string }).confidence)).toEqual([undefined, "sure"]);

      const open = async (conceptStableId: string, owner = "learner") => database
        ? (await database.db.select({ status: mistakes.status, summary: mistakes.summary }).from(mistakes).innerJoin(concepts, eq(concepts.id, mistakes.conceptId)).where(and(eq(concepts.stableId, conceptStableId), eq(mistakes.ownerId, owner))))
        : store.mistakes.filter(row => row.conceptStableId === conceptStableId && row.ownerId === owner).map(({ status, summary }) => ({ status, summary }));
      expect(await open("MAT.PCT.CALCULATE")).toEqual([{ status: "active", summary: BLIND_SPOT_SUMMARY }]);
      // A retry right after a wrong answer is still independent, unless the student says it was a guess.
      await answer("mat07-q1", "Q-MAT-GOLDEN-1", "15", "guess");
      expect((await open("MAT.PCT.CONCEPT")).map(row => row.status)).toEqual(["active"]);
      await repository.view("other", "mat07-q1", "Q-MAT-GOLDEN-1", 1);
      await answer("mat07-q1", "Q-MAT-GOLDEN-1", "14", undefined, "other");
      await answer("mat07-q1", "Q-MAT-GOLDEN-1", "15", "sure", "other");
      expect((await open("MAT.PCT.CONCEPT", "other")).map(row => row.status)).toEqual(["resolved"]);
    } finally {
      await database?.close();
    }
  });
});
