import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { MemoryTrackImportRepository } from "@/db/repositories/memory-store";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { MemoryStudySessionRepository } from "@/db/repositories/memory-study-session-repository";
import { QuestionStudyRepository } from "@/db/repositories/question-study-repository";
import { MemoryQuestionStudyRepository } from "@/db/repositories/memory-question-study-repository";
import { lessons, questionVersions, concepts, owners, reviewSchedules, mistakes, conceptEvidence } from "@/db/schema";
import { sessionItemsSchema } from "@/features/study-sessions/contracts";
import { questionSchema } from "@/features/questions/contracts";
import { AssessmentRepository } from "@/db/repositories/assessment-repository";
import { MemoryAssessmentRepository } from "@/db/repositories/memory-assessment-repository";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
import { MistakeRepository } from "@/db/repositories/mistake-repository";
import { MemoryMistakeRepository } from "@/db/repositories/memory/reviews";
import { AiLearningRepository, MemoryAiLearningRepository } from "@/db/repositories/ai-learning-repository";
import { CatalogRepository } from "@/db/repositories/catalog-repository";
import { MemoryCatalogRepository } from "@/db/repositories/memory-store";
import { ConceptRelationRepository, MemoryConceptRelationRepository } from "@/db/repositories/concept-relation-repository";
import { AIService } from "@/features/ai/ai-service";
import { aiRequestSchema } from "@/features/ai/contracts";
import { resolveAiContext } from "@/features/ai/context";

const now = new Date("2026-10-06T12:00:00Z");
function fixture(version = 1) {
  const result = structuredClone(source);
  result.version = version;
  for (const question of result.questions) { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; }
  for (const moduleRecord of result.track.modules) for (const lesson of moduleRecord.lessons) { lesson.status = "published"; lesson.version = version; if (version > 1) lesson.title += " — nova edição"; }
  return result;
}
async function setup(kind: "memory" | "sql", seed = true, initial = fixture()) {
  const database = kind === "sql" ? await createMigratedPgliteTestDatabase() : undefined;
  const store = structuredClone(getMemoryStore());
  store.packImports = []; store.studySessions = []; store.studyPlans = []; store.studyPlanPreviews = []; store.attempts = []; store.conceptEvidence = []; store.questionAssistance = []; store.questionExposures = []; store.assessmentInstances = []; store.reviewSchedules = []; store.mistakes = [];
  const importer = database ? new DrizzleTrackImportRepository(database.db) : new MemoryTrackImportRepository(store);
  async function imported(version = 1, input = fixture(version)) {
    const importedResult = await importTrackPack(input, importer);
    expect(importedResult.status, JSON.stringify(importedResult)).toBe("imported");
    if (database) {
      for (const lesson of await database.db.select().from(lessons)) if (lesson.contentVersion === version && input.track.modules.some(moduleRecord => moduleRecord.lessons.some(definition => definition.id === lesson.stableId && definition.status === "published"))) await database.db.update(lessons).set({ metadata: { ...lesson.metadata as object, status: "published", qaReleaseId: crypto.randomUUID() } }).where(eq(lessons.id, lesson.id));
      for (const question of input.questions.filter(question => question.status === "published")) {
        const rows = await database.db.select().from(questionVersions);
        for (const row of rows) if ((row.content as { id: string }).id === question.id) await database.db.update(questionVersions).set({ status: "published" }).where(eq(questionVersions.id, row.id));
      }
    }
  }
  if (seed) await imported(1,initial);
  return { database, store, imported,
    sessions: database ? new StudySessionRepository(database.db, false, true) : new MemoryStudySessionRepository(store, false, true),
    questions: database ? new QuestionStudyRepository(database.db) : new MemoryQuestionStudyRepository(store) };
}

describe.each(["memory", "sql"] as const)("adaptive sessions (%s)", kind => {
  it("resolves declared AI prerequisite relations from actually published Concepts without mixing public and internal track IDs",async()=>{
    const ctx=await setup(kind);
    try{
      const edge=source.conceptPrerequisites[0];expect(edge).toBeDefined();
      const relations=ctx.database?new ConceptRelationRepository(ctx.database.db):new MemoryConceptRelationRepository(ctx.store);
      const input=aiRequestSchema.parse({requestId:crypto.randomUUID(),action:"explain_concept_relation",target:{kind:"relation",conceptId:edge.conceptId,relatedConceptId:edge.prerequisiteConceptId}});
      const context=await resolveAiContext("learner",input,{catalog:ctx.database?new CatalogRepository(ctx.database.db):new MemoryCatalogRepository(ctx.store),questions:ctx.questions,sessions:ctx.sessions,mistakes:ctx.database?new MistakeRepository(ctx.database.db):new MemoryMistakeRepository(ctx.store),relations});
      expect(context.facts).toMatchObject({strength:edge.strength,officialMappingCertified:false});expect(context.sourceKey).toMatch(/^[a-f0-9]{64}$/);
      expect(await relations.list(edge.conceptId)).toContainEqual(expect.objectContaining({prerequisiteConceptId:edge.prerequisiteConceptId,strength:edge.strength}));
    }finally{await ctx.database?.close();}
  });
  it("attests fresh and cached AI guidance through canonical help without creating Attempts or independent success",async()=>{
    const ctx=await setup(kind);
    try{
      const plan=(await ctx.sessions.plan("learner",10,now))!;await ctx.sessions.transition("learner",plan.id,"start",now);
      const activity=sessionItemsSchema.parse(plan.items)[0].activitySnapshots![0];
      const input=aiRequestSchema.parse({requestId:crypto.randomUUID(),action:"give_hint",target:{kind:"question",activityId:activity.stableId,questionId:activity.config.questionId,questionVersion:activity.config.questionVersion,sessionId:plan.id}});
      const context=await resolveAiContext("learner",input,{
        catalog:ctx.database?new CatalogRepository(ctx.database.db):new MemoryCatalogRepository(ctx.store),questions:ctx.questions,sessions:ctx.sessions,
        mistakes:ctx.database?new MistakeRepository(ctx.database.db):new MemoryMistakeRepository(ctx.store),relations:ctx.database?new ConceptRelationRepository(ctx.database.db):new MemoryConceptRelationRepository(ctx.store)
      });
      let calls=0;
      const ledger=ctx.database?new AiLearningRepository(ctx.database.db):new MemoryAiLearningRepository(ctx.store);
      const service=new AIService({id:"mock",model:"small",configured:true,assist:async()=>{calls++;return{ok:true,rawJson:'{"text":"Consulte as partes do todo."}'};}},ledger,()=>now);
      expect(await service.execute("learner",input,context)).toMatchObject({assisted:true,cached:false});
      expect(await service.execute("learner",{...input,requestId:crypto.randomUUID()},context)).toMatchObject({assisted:true,cached:true});expect(calls).toBe(1);
      const view=await ctx.questions.view("learner",activity.stableId,activity.config.questionId,activity.config.questionVersion,plan.id);
      expect(view.assistance.solutionRevealed).toBe(true);
      expect(ctx.database?(await ctx.database.db.select().from(conceptEvidence)).length:ctx.store.conceptEvidence.length).toBe(0);
      const answer=questionSchema.parse(source.questions.find(q=>q.id===activity.config.questionId)).answer;
      const response=answer.kind==="numeric"?String(answer.value):answer.kind==="multiple_choice"?answer.choiceId:answer.kind==="ordering"?answer.orderedIds:answer.kind==="matching"?answer.pairs:answer.assignments;
      await ctx.questions.interact("learner",activity.stableId,{action:"submit",questionId:activity.config.questionId,questionVersion:activity.config.questionVersion,sessionId:plan.id,submissionKey:crypto.randomUUID(),response});
      await ctx.sessions.transition("learner",plan.id,"complete",now);
      expect((await ctx.sessions.result("learner",plan.id))!.summary).toMatchObject({attempts:1,correct:1,independentConcepts:[]});
    }finally{await ctx.database?.close();}
  });
  it("uses actual owned due Concepts for targeted retrieval without changing schedule/evidence",async()=>{
    const ctx=await setup(kind);
    try{
      const conceptId=source.questions[0].conceptIds[0];
      if(ctx.database){
        await ctx.database.db.insert(owners).values({id:"learner",displayName:"Test learner"}).onConflictDoNothing();
        const [concept]=await ctx.database.db.select().from(concepts).where(eq(concepts.stableId,conceptId));
        await ctx.database.db.insert(reviewSchedules).values({ownerId:"learner",conceptId:concept.id,currentMasteryState:"learning",nextReviewAt:now,policyVersion:"review.v2",reviewCount:0,recentQuality:0});
      }else ctx.store.reviewSchedules.push({ownerId:"learner",conceptStableId:conceptId,currentMasteryState:"learning",lastReviewedAt:null,nextReviewAt:now,reviewCount:0,recentQuality:0,policyVersion:"review.v2",updatedAt:now});
      const planner=ctx.database?new StudySessionRepository(ctx.database.db,false,false):new MemoryStudySessionRepository(ctx.store,false,false);
      const result=await planner.plan("learner",10,now,{kind:"review",conceptId});
      expect(result).not.toBeNull();const items=sessionItemsSchema.parse(result!.items);
      expect(items.every(item=>item.intent==="review"&&item.delivery==="questions")).toBe(true);
      expect(items.flatMap(item=>item.questions).every(ref=>source.questions.find(q=>q.id===ref.id)?.conceptIds.includes(conceptId))).toBe(true);
      await expect(planner.plan("other",10,now,{kind:"review",conceptId})).rejects.toMatchObject({code:"review_not_due"});
      if(ctx.database){expect(await ctx.database.db.select().from(conceptEvidence)).toHaveLength(0);expect((await ctx.database.db.select().from(reviewSchedules))[0].reviewCount).toBe(0);}
      else {expect(ctx.store.conceptEvidence).toHaveLength(0);expect(ctx.store.reviewSchedules[0].reviewCount).toBe(0);}
      const unlockAt = "2026-10-07T12:00:00Z";
      if (ctx.database) for (const row of await ctx.database.db.select().from(questionVersions)) {
        const question = questionSchema.parse(row.content);
        question.exposurePolicy.reservedForAssessment = true; question.exposurePolicy.unlockAt = unlockAt;
        await ctx.database.db.update(questionVersions).set({ content: question }).where(eq(questionVersions.id, row.id));
      }
      else for (const entry of ctx.store.packImports) if (entry.manifest?.schema === "caderno.track.v2") for (const question of entry.manifest.questions) {
        question.exposurePolicy.reservedForAssessment = true; question.exposurePolicy.unlockAt = unlockAt;
      }
      expect(await planner.plan("learner", 10, now, { kind: "review", conceptId })).toBeNull();
      expect((await planner.get("learner", result!.id))?.status).toBe("PLANNED");
      expect(await planner.plan("learner", 10, new Date(unlockAt), { kind: "review", conceptId })).not.toBeNull();
    }finally{await ctx.database?.close();}
  });
  it("validates a recorded mistake before preserving ACTIVE membership and excludes its Question on retry",async()=>{
    const initial=fixture(), originals=initial.questions.slice();
    initial.questions.push(...originals.map(q=>({...structuredClone(q),id:`${q.id}-alternate`})));
    for(const moduleRecord of initial.track.modules)for(const lesson of moduleRecord.lessons){
      const originalActivities=lesson.activities.slice();
      lesson.activities.push(...originalActivities.filter(a=>a.type==="question"&&a.questionId).map(a=>({...structuredClone(a),id:`${a.id}-alternate`,questionId:`${a.questionId}-alternate`,config:{...a.config,questionId:`${a.questionId}-alternate`}})));
    }
    const ctx=await setup(kind,true,initial);
    try{
      const original=(await ctx.sessions.plan("learner",10,now))!;await ctx.sessions.transition("learner",original.id,"start",now);
      const item=sessionItemsSchema.parse(original.items)[0],activity=item.activitySnapshots![0];
      const view=await ctx.questions.view("learner",activity.stableId,activity.config.questionId,activity.config.questionVersion,original.id);
      const canonical=initial.questions.find(q=>q.id===activity.config.questionId)!;
      const response=canonical.answer.kind==="numeric"?String((canonical.answer.value??0)+999):canonical.answer.kind==="multiple_choice"?canonical.choices!.find(c=>!c.correct)!.id:"invalid-response";
      expect(await ctx.questions.interact("learner",activity.stableId,{action:"submit",questionId:activity.config.questionId,questionVersion:activity.config.questionVersion,sessionId:original.id,submissionKey:crypto.randomUUID(),response})).toMatchObject({correct:false});
      expect(view.question.id).toBe(canonical.id);
      const record=ctx.database?(await ctx.database.db.select().from(mistakes))[0]:ctx.store.mistakes[0];
      const planner=ctx.database?new StudySessionRepository(ctx.database.db,false,false):new MemoryStudySessionRepository(ctx.store,false,false);
      const retained=await planner.plan("learner",10,now,{kind:"remediation",mistakeId:record.id});expect(retained!.id).toBe(original.id);expect(retained!.items).toEqual(original.items);
      await expect(planner.plan("other",10,now,{kind:"remediation",mistakeId:record.id})).rejects.toMatchObject({code:"target_unavailable"});
      await ctx.sessions.transition("learner",original.id,"abandon",now);
      const retry=await planner.plan("learner",10,now,{kind:"remediation",mistakeId:record.id});expect(retry).not.toBeNull();
      const retryItems=sessionItemsSchema.parse(retry!.items);expect(retryItems.every(i=>i.intent==="remediation")).toBe(true);expect(retryItems.flatMap(i=>i.questions).every(q=>q.id!==canonical.id)).toBe(true);
      const observations=ctx.database?new MistakeRepository(ctx.database.db):new MemoryMistakeRepository(ctx.store);
      const reflection={mistakeId:record.id,mutationId:crypto.randomUUID(),category:"calculation_error" as const,note:"Percebi um erro na conta."};
      const beforeEvidence=ctx.database?(await ctx.database.db.select().from(conceptEvidence)).length:ctx.store.conceptEvidence.length;
      const reflectionId=await observations.recordReflection("learner",reflection);
      expect(await observations.recordReflection("learner",reflection)).toBe(reflectionId);
      expect(await observations.listReflections("learner")).toHaveLength(1);
      expect(await observations.listReflections("other")).toHaveLength(0);
      await expect(observations.recordReflection("other",reflection)).rejects.toThrow("Mistake unavailable");
      await expect(observations.recordReflection("learner",{...reflection,note:"Outro texto"})).rejects.toThrow("Reflection conflict");
      expect(ctx.database?(await ctx.database.db.select().from(conceptEvidence)).length:ctx.store.conceptEvidence.length).toBe(beforeEvidence);
      if (ctx.database) for (const row of await ctx.database.db.select().from(questionVersions)) {
        if ((row.content as { id: string }).id !== canonical.id) await ctx.database.db.update(questionVersions).set({ status: "retired" }).where(eq(questionVersions.id, row.id));
      }
      else for (const entry of ctx.store.packImports) if (entry.manifest?.schema === "caderno.track.v2") for (const question of entry.manifest.questions) if (question.id !== canonical.id) question.status = "retired";
      expect(await planner.plan("learner", 10, now, { kind: "remediation", mistakeId: record.id })).toBeNull();
      expect((await planner.get("learner", retry!.id))?.status).toBe("PLANNED");
    }finally{await ctx.database?.close();}
  });
  it("blocks new training composition while an owned EXAM is active", async () => {
    const ctx = await setup(kind, false);
    try {
      const input = fixture();
      const examQuestions = ["MAT", "POR", "CIE", "GH"].flatMap(subjectCode => Array.from({ length: 7 }, (_, index) => {
        const original = input.questions.find(question => question.subjectCode === subjectCode)!;
        return questionSchema.parse({ ...original, id: `exam-${subjectCode}-${index}`, type: "multiple_choice", choices: Array.from({ length: 5 }, (_, option) => ({ id: String(option), content: `Opção ${option}`, correct: option === 0 })), answer: { kind: "multiple_choice", choiceId: "0" } });
      }));
      Object.assign(input, { questions: [...input.questions, ...examQuestions] });
      await ctx.imported(1, input);
      const prepared = (await ctx.sessions.plan("learner", 10, now))!;
      const exams = ctx.database ? new AssessmentRepository(ctx.database.db) : new MemoryAssessmentRepository(ctx.store);
      const template = await exams.importTemplate({ id: "adaptive-blocking-exam", version: 1, title: "Simulado de fixture", kind: "FULL_SIMULATION", trackId: input.track.id, durationMinutes: 60, status: "published", items: examQuestions.map(question => ({ id: question.id, version: question.version })) });
      const ai = ctx.database ? new AiLearningRepository(ctx.database.db) : new MemoryAiLearningRepository(ctx.store);
      const ticket = await ai.claim("learner", crypto.randomUUID(), "a".repeat(64), now, { provider: "mock", model: "small" });
      await exams.start("learner", template.id, crypto.randomUUID(), now);
      expect(await ctx.sessions.plan("learner", 20, now)).toBeNull();
      await expect(ctx.sessions.plan("learner", 10, now, { kind: "review" })).rejects.toMatchObject({ code: "exam_active" });
      await expect(ctx.sessions.plan("learner", 10, now, { kind: "remediation", mistakeId: crypto.randomUUID() })).rejects.toMatchObject({ code: "exam_active" });
      await expect(ai.claim("learner", crypto.randomUUID(), "b".repeat(64), now, { provider: "mock", model: "small" })).rejects.toMatchObject({ code: "exam_active" });
      await expect(ai.complete("learner", ticket.id, { ok: true, output: { text: "A clue." }, cached: false }, now)).rejects.toMatchObject({ code: "exam_active" });
      await ai.complete("learner", ticket.id, { ok: false, code: "exam_active" }, now);
      const firstActivity = sessionItemsSchema.parse(prepared.items)[0].activitySnapshots![0];
      await expect(ctx.questions.aiContext("learner", firstActivity.stableId, firstActivity.config.questionId, firstActivity.config.questionVersion)).rejects.toThrow("Question unavailable");
      expect((await ctx.sessions.get("learner", prepared.id))?.status).toBe("PLANNED");
    } finally { await ctx.database?.close(); }
  });

  it("excludes draft, retired and reserved Questions using the supplied planning clock", async () => {
    const ctx = await setup(kind);
    try {
      const input = fixture();
      input.questions.forEach((question, index) => {
        if (index % 3 === 0) question.status = "draft";
        else if (index % 3 === 1) { question.exposurePolicy.reservedForAssessment = true; Object.assign(question.exposurePolicy, { unlockAt: "2026-10-07T12:00:00Z" }); }
        else question.status = "retired";
      });
      // Simulate canonical availability changes after import in this disposable fixture.
      if (ctx.database) for (const row of await ctx.database.db.select().from(questionVersions)) {
        const question = input.questions.find(question => question.id === (row.content as { id: string }).id)!;
        await ctx.database.db.update(questionVersions).set({ status: question.status, content: question }).where(eq(questionVersions.id, row.id));
      }
      else for (const entry of ctx.store.packImports) if (entry.manifest?.schema === "caderno.track.v2") for (const question of entry.manifest.questions) Object.assign(question, input.questions.find(input => input.id === question.id));
      expect(await ctx.sessions.plan("learner", 20, now)).toBeNull();
      const later = await ctx.sessions.plan("learner", 20, new Date("2026-10-07T12:00:00Z"));
      expect(later).not.toBeNull();
      expect(sessionItemsSchema.parse(later!.items).flatMap(item => item.questions).every(ref => input.questions.find(question => question.id === ref.id)?.exposurePolicy.reservedForAssessment)).toBe(true);
      const activity = sessionItemsSchema.parse(later!.items)[0].activitySnapshots![0];
      await expect(ctx.questions.aiContext("learner", activity.stableId, activity.config.questionId, activity.config.questionVersion)).rejects.toMatchObject({ code: "context_unavailable" });
    } finally { await ctx.database?.close(); }
  });

  it("records independent evidence only on submit and omits successful Questions from ordinary practice", async () => {
    const ctx = await setup(kind);
    try {
      const plan = (await ctx.sessions.plan("learner", 10, now))!;
      await ctx.sessions.transition("learner", plan.id, "start", now);
      const item = sessionItemsSchema.parse(plan.items)[0], activity = item.activitySnapshots![0];
      await ctx.questions.view("learner", activity.stableId, activity.config.questionId, activity.config.questionVersion, plan.id);
      const answer = questionSchema.parse(source.questions.find(question => question.id === activity.config.questionId)).answer;
      const response = answer.kind === "numeric" ? String(answer.value) : answer.kind === "multiple_choice" ? answer.choiceId : answer.kind === "ordering" ? answer.orderedIds : answer.kind === "matching" ? answer.pairs : answer.assignments;
      const submission = { action: "submit" as const, questionId: activity.config.questionId, questionVersion: activity.config.questionVersion, sessionId: plan.id, submissionKey: crypto.randomUUID(), response };
      expect(await ctx.questions.interact("learner", activity.stableId, submission)).toMatchObject({ correct: true });
      await ctx.questions.interact("learner", activity.stableId, submission);
      await ctx.sessions.transition("learner", plan.id, "complete", new Date(now.getTime() + 120_000));
      const summary = (await ctx.sessions.result("learner", plan.id))!.summary;
      expect(summary).toMatchObject({ attempts: 1, answered: 1, correct: 1 });
      expect(summary.independentConcepts.length).toBeGreaterThan(0);
      const next = (await ctx.sessions.plan("learner", 45, now))!;
      expect(sessionItemsSchema.parse(next.items).flatMap(item => item.questions).some(question => question.id === activity.config.questionId)).toBe(false);
    } finally { await ctx.database?.close(); }
  });

  it("composes distinct tracks and allows their frozen members without expanding membership", async () => {
    const ctx = await setup(kind, false);
    try {
      for (const subject of ["CIE", "GH"]) {
        const input = fixture(2);
        input.packId += subject.toLowerCase(); input.track.id += subject;
        for (const question of input.questions) question.status = ["Q-CIE-GOLDEN-1", "Q-GH-GOLDEN-1"].includes(question.id) ? "published" : "retired";
        for (const moduleRecord of input.track.modules) {
          moduleRecord.id += subject;
          for (const lesson of moduleRecord.lessons) { lesson.id += subject; lesson.status = moduleRecord.subjectCode === subject ? "published" : "draft"; }
        }
        await ctx.imported(2, input);
      }
      const plan = await ctx.sessions.plan("learner", 20, now);
      const items = sessionItemsSchema.parse(plan!.items);
      expect(new Set(items.map(item => item.trackId)).size).toBe(2);
      await ctx.sessions.transition("learner", plan!.id, "start", now);
      for (const item of items) {
        const activity = item.activitySnapshots![0];
        expect((await ctx.questions.view("learner", activity.stableId, activity.config.questionId, activity.config.questionVersion, plan!.id)).question.id).toBe(activity.config.questionId);
      }
      await expect(ctx.questions.view("learner", "mat-prereq-q1", "Q-MAT-PREREQ-1", 1, plan!.id)).rejects.toThrow("Question unavailable");
    } finally { await ctx.database?.close(); }
  });

  it("composes short frozen actions, does not emit evidence on planning/completion, and resumes old versions", async () => {
    const ctx = await setup(kind);
    try {
      const plan = await ctx.sessions.plan("learner", 10, now); expect(plan).not.toBeNull();
      const items = sessionItemsSchema.parse(plan!.items);
      expect(items.reduce((sum, item) => sum + item.minutes, 0)).toBeLessThanOrEqual(10);
      expect(items.every(item => item.delivery === "questions" && item.trackId && item.activitySnapshots?.length)).toBe(true);
      expect(items[0].caveats).toContain("Não há registro completo de QA independente para esta versão.");
      await ctx.sessions.transition("learner", plan!.id, "start", now);
      const before = structuredClone((await ctx.sessions.get("learner", plan!.id))!.items);
      await ctx.imported(2);
      expect((await ctx.sessions.plan("learner", 45, new Date(now.getTime() + 60_000)))?.id).toBe(plan!.id);
      expect((await ctx.sessions.get("learner", plan!.id))!.items).toEqual(before);
      const item = items[0], activity = item.activitySnapshots![0];
      expect((await ctx.questions.view("learner", activity.stableId, activity.config.questionId, activity.config.questionVersion, plan!.id)).question.id).toBe(activity.config.questionId);
      await expect(ctx.questions.view("another-owner", activity.stableId, activity.config.questionId, activity.config.questionVersion, plan!.id)).rejects.toThrow("Question unavailable");
      await ctx.sessions.transition("learner", plan!.id, "complete", new Date(now.getTime() + 120_000));
      const result = await ctx.sessions.result("learner", plan!.id);
      expect(result?.summary.independentConcepts).toEqual([]); expect(result?.summary.attempts).toBe(0); expect(result?.summary.wallMinutes).toBe(2);
    } finally { await ctx.database?.close(); }
  });

  it("keeps budget choices compatible, guards unavailable training, and preserves a prepared snapshot on no fit", async () => {
    const ctx = await setup(kind);
    try {
      for (const budget of [10, 20, 30, 45] as const) {
        const plan = await ctx.sessions.plan("learner", budget, now); expect(plan).not.toBeNull();
        expect(sessionItemsSchema.parse(plan!.items).reduce((sum, item) => sum + item.minutes, 0)).toBeLessThanOrEqual(budget);
      }
      const prepared = (await ctx.sessions.list("learner")).find(session => session.status === "PLANNED")!;
      if (ctx.database) await ctx.database.db.update(questionVersions).set({ status: "retired" });
      else for (const entry of ctx.store.packImports) if (entry.manifest?.schema === "caderno.track.v2") for (const question of entry.manifest.questions) question.status = "retired";
      expect(await ctx.sessions.plan("learner", 10, now)).toBeNull();
      expect(await ctx.sessions.plan("learner", 10, now, { kind: "review" })).toBeNull();
      expect((await ctx.sessions.get("learner", prepared.id))?.status).toBe("PLANNED");
      const legacy = ctx.database ? new StudySessionRepository(ctx.database.db) : new MemoryStudySessionRepository(ctx.store);
      await expect(legacy.plan("learner", 10, now)).rejects.toThrow();
    } finally { await ctx.database?.close(); }
  });
});
