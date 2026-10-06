import { expect,it } from "vitest";
import pack from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { QuestionStudyRepository } from "@/db/repositories/question-study-repository";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { attempts,conceptEvidence,reviewSchedules,concepts,owners,xpTransactions } from "@/db/schema";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
import { simulatePublication } from "./ifsc-publication-fixture";
it("completes the percentage slice, deduplicates retries and isolates owners",async()=>{
  const database=await createMigratedPgliteTestDatabase();
  try{
    // Publication is simulated only in this disposable fixture. The source seed remains draft.
    const fixture=JSON.parse(JSON.stringify(pack));fixture.questions.forEach((question:{status:string})=>question.status="published");fixture.track.modules[0].lessons[1].status="published";
    expect((await importTrackPack(fixture,new DrizzleTrackImportRepository(database.db))).status).toBe("imported");
    await simulatePublication(database.db);
    await database.db.insert(owners).values({id:"student-a",displayName:"Test learner"});
    const prerequisites=(await database.db.select().from(concepts)).filter(concept=>["MAT.FRACTION.MEANING","MAT.DECIMAL.MEANING","MAT.PROPORTION.CONCEPT"].includes(concept.stableId));
    for(const concept of prerequisites)await database.db.insert(conceptEvidence).values({ownerId:"student-a",conceptId:concept.id,type:"diagnostic_result",strength:2,sourceType:"disposable_test",sourceId:crypto.randomUUID(),conditions:{outcome:"passed"}});
    const sessions=new StudySessionRepository(database.db);const questions=new QuestionStudyRepository(database.db);
    const session=await sessions.plan("student-a",15);expect(session).not.toBeNull();
    expect(await sessions.get("student-b",session!.id)).toBeNull();
    await sessions.transition("student-a",session!.id,"start");
    const frozen=session!.items;expect((await sessions.plan("student-a",30))!.items).toEqual(frozen);
    const view=await questions.view("student-a","mat07-q3","Q-MAT-GOLDEN-3",1,session!.id);
    expect(view.question).not.toHaveProperty("answer");expect(view.question).not.toHaveProperty("explanation");
    // A wrong answer hides the worked solution, so the corrected retry is still independent evidence.
    const wrong=await questions.interact("student-a","mat07-q3",{questionId:"Q-MAT-GOLDEN-3",questionVersion:1,action:"submit",submissionKey:crypto.randomUUID(),response:"29",sessionId:session!.id});
    expect(wrong).toMatchObject({correct:false,xpAwarded:0});expect(wrong.explanation).toBeUndefined();
    expect(await database.db.select().from(xpTransactions)).toHaveLength(0);
    const input={questionId:"Q-MAT-GOLDEN-3",questionVersion:1,action:"submit" as const,submissionKey:crypto.randomUUID(),response:"30 %",sessionId:session!.id};
    const first=await questions.interact("student-a","mat07-q3",input);expect(first).toMatchObject({correct:true,xpAwarded:20});expect(first.explanation).toBeTruthy();
    const passedEvidence=(await database.db.select().from(conceptEvidence)).filter(item=>item.sourceType==="question_attempt"&&(item.conditions as Record<string,unknown>).outcome==="passed");
    expect(passedEvidence.length).toBeGreaterThan(0);expect(passedEvidence.every(item=>(item.conditions as Record<string,unknown>).solutionRevealed===false)).toBe(true);
    expect(await questions.interact("student-a","mat07-q3",input)).toEqual({...first,xpAwarded:0});
    expect(await database.db.select().from(xpTransactions)).toMatchObject([{ownerId:"student-a",amount:20,sourceType:"question",sourceId:"Q-MAT-GOLDEN-3"}]);
    await expect(questions.interact("student-a","mat07-q3",{...input,response:"31"})).rejects.toThrow("Submission key");
    await expect(questions.interact("student-b","mat07-q3",input)).rejects.toThrow("unavailable");
    expect(await database.db.select().from(attempts)).toHaveLength(2);
    expect(await database.db.select().from(conceptEvidence)).toHaveLength(5);
    expect(await database.db.select().from(reviewSchedules)).toHaveLength(1);
    await sessions.transition("student-a",session!.id,"complete");expect((await sessions.result("student-a",session!.id))!).toMatchObject({answered:1,correct:1});
    await expect(sessions.transition("student-a",session!.id,"start")).rejects.toThrow("Session state");
  }finally{await database.close();}
});
