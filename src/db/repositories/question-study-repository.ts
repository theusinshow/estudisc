import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";
import { getDatabase } from "@/db/connection";
import { activities, attempts, conceptEvidence, concepts, lessons, modules, owners, questionAssistance, questionExposures, questionVersions, reviewSchedules, studyEvents, studySessions, mistakes,assessmentInstances } from "@/db/schema";
import { DrizzleQuestionRepository } from "./question-repository";
import { canExposeQuestion } from "@/features/questions/exposure";
import { evaluateQuestion, QUESTION_EVALUATOR_VERSION } from "@/features/questions/evaluation";
import { studentQuestion } from "@/features/questions/student-view";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { evidenceStrengthV2, MASTERY_V2 } from "@/features/mastery/mastery-policy-v2";
import { scheduleReviewV2, REVIEW_V2 } from "@/features/review/review-policy-v2";

type Database=PgDatabase<PgQueryResultHKT,typeof schema>;
export class QuestionUnavailableError extends Error { constructor(){super("Question unavailable");} }
export class SubmissionConflictError extends Error { constructor(){super("Submission key conflicts with a previous response");} }
export class QuestionStudyRepository {
  constructor(private readonly db:Database=getDatabase()){}
  async isAvailable(ownerId:string,activity:string,questionId:string,version:number){
    const ctx=await this.context(ownerId,activity,questionId,version);
    const [identity]=await this.db.select().from(questionVersions).where(eq(questionVersions.id,ctx.versionId));
    const [exposure]=await this.db.select().from(questionExposures).where(and(eq(questionExposures.ownerId,ownerId),eq(questionExposures.questionId,identity.questionId)));
    return canExposeQuestion(ctx.question,{now:new Date(),context:"training",exposure:exposure??undefined});
  }
  private async context(ownerId:string, activityStableId:string, questionId:string, version:number, sessionId?:string) {
    const [exam]=await this.db.select({id:assessmentInstances.id}).from(assessmentInstances).where(and(eq(assessmentInstances.ownerId,ownerId),eq(assessmentInstances.status,"ACTIVE"),eq(assessmentInstances.mode,"EXAM")));if(exam)throw new QuestionUnavailableError();
    const rows=await this.db.select({activity:activities,lesson:lessons,trackId:modules.trackId}).from(activities).innerJoin(lessons,eq(lessons.id,activities.lessonId)).innerJoin(modules,eq(modules.id,lessons.moduleId)).where(eq(activities.stableId,activityStableId)).orderBy(desc(lessons.contentVersion));
    const row=rows.find(row=>{const config=questionReferenceSchema.safeParse(row.activity.config);return row.activity.type==="question"&&config.success&&config.data.questionId===questionId&&config.data.questionVersion===version;});
    if(!row)throw new QuestionUnavailableError();
    if(sessionId){const [session]=await this.db.select().from(studySessions).where(and(eq(studySessions.id,sessionId),eq(studySessions.ownerId,ownerId))); if(!session||session.status!=="ACTIVE"||session.trackId!==row.trackId||!Array.isArray(session.items)||!session.items.some(item=>item.lessonId===row.lesson.stableId&&item.version===row.lesson.contentVersion&&item.activityIds.includes(row.activity.stableId)&&item.questions.some((question:{id:string;version:number})=>question.id===questionId&&question.version===version)))throw new QuestionUnavailableError();}
    const frozen=await new DrizzleQuestionRepository(this.db).getVersion(questionId,version);
    if(!frozen||!canExposeQuestion(frozen.question,{now:new Date(),context:"training"}))throw new QuestionUnavailableError();
    return {...row,...frozen,contextKey:sessionId??`lesson:${row.lesson.id}`,config:questionReferenceSchema.parse(row.activity.config)};
  }
  async view(ownerId:string, activity:string,questionId:string,version:number,sessionId?:string){
    return this.db.transaction(async tx=>{
      await tx.insert(owners).values({id:ownerId,displayName:"Private learner"}).onConflictDoNothing();
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const ctx=await new QuestionStudyRepository(tx).context(ownerId,activity,questionId,version,sessionId);
      const where=and(eq(questionAssistance.ownerId,ownerId),eq(questionAssistance.questionVersionId,ctx.versionId),eq(questionAssistance.contextKey,ctx.contextKey));
      const [opened]=await tx.select().from(questionAssistance).where(where);
      if(!opened){
        const [identity]=await tx.select().from(questionVersions).where(eq(questionVersions.id,ctx.versionId));
        const [exposure]=await tx.select().from(questionExposures).where(and(eq(questionExposures.ownerId,ownerId),eq(questionExposures.questionId,identity.questionId)));
        if(!canExposeQuestion(ctx.question,{now:new Date(),context:"training",exposure:exposure??undefined}))throw new QuestionUnavailableError();
        await tx.insert(questionAssistance).values({ownerId,questionVersionId:ctx.versionId,contextKey:ctx.contextKey});
        await tx.insert(questionExposures).values({ownerId,questionId:identity.questionId,firstSeenAt:new Date(),lastSeenAt:new Date(),timesSeen:1,lastContext:"learn"}).onConflictDoUpdate({target:[questionExposures.ownerId,questionExposures.questionId],set:{lastSeenAt:new Date(),timesSeen:sql`${questionExposures.timesSeen}+1`,lastContext:"learn"}});
      }
      const [latest]=await tx.select().from(attempts).where(and(eq(attempts.ownerId,ownerId),eq(attempts.questionVersionId,ctx.versionId),sql`${attempts.context}->>'contextKey'=${ctx.contextKey}`)).orderBy(desc(attempts.createdAt)).limit(1);
      return {question:studentQuestion(ctx.question),hintCount:ctx.config.hints.length,lastAnswer:latest?.response?(latest.response as {answer:unknown}).answer:undefined};
    });
  }
  async interact(ownerId:string,activity:string,input:{questionId:string;questionVersion:number;action:"submit"|"hint"|"solution";submissionKey:string;response:unknown;sessionId?:string}) {
    return this.db.transaction(async tx=>{
      await tx.insert(owners).values({id:ownerId,displayName:"Private learner"}).onConflictDoNothing();
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const ctx=await new QuestionStudyRepository(tx).context(ownerId,activity,input.questionId,input.questionVersion,input.sessionId);
      const where=and(eq(questionAssistance.ownerId,ownerId),eq(questionAssistance.questionVersionId,ctx.versionId),eq(questionAssistance.contextKey,ctx.contextKey));
      const [assistance]=await tx.select().from(questionAssistance).where(where);
      if(!assistance)throw new QuestionUnavailableError();
      if(input.action!=="submit"){
        const hintLevel=input.action==="hint"?Math.min(assistance.hintLevel+1,ctx.config.hints.length):assistance.hintLevel;
        await tx.update(questionAssistance).set({hintLevel,solutionRevealed:input.action==="solution"?1:assistance.solutionRevealed,updatedAt:new Date()}).where(where);
        await tx.insert(studyEvents).values({ownerId,type:"question_assistance",entityType:"question",entityId:ctx.question.id,payload:{version:ctx.question.version,action:input.action,hintLevel,contextKey:ctx.contextKey}});
        return input.action==="hint"?{hintLevel,hint:ctx.config.hints[hintLevel-1]}:{correct:false,explanation:ctx.question.explanation??"Solução ainda não disponível."};
      }
      const [previous]=await tx.select().from(attempts).where(and(eq(attempts.ownerId,ownerId),eq(attempts.submissionKey,input.submissionKey)));
      if(previous){if(previous.activityId!==ctx.activity.id||hashCanonicalJson(previous.response)!==hashCanonicalJson({answer:input.response}))throw new SubmissionConflictError();return {attemptId:previous.id,correct:previous.outcome==="passed",explanation:ctx.question.explanation};}
      const evaluation=evaluateQuestion(ctx.question,input.response);
      if(!evaluation.evidenceEligible)throw new QuestionUnavailableError();
      const [number]=await tx.select({value:count()}).from(attempts).where(and(eq(attempts.ownerId,ownerId),eq(attempts.activityId,ctx.activity.id)));
      const now=new Date();
      const conditions={policyVersion:MASTERY_V2,outcome:evaluation.outcome,difficulty:ctx.question.difficulty,mode:"learn",hintLevel:assistance.hintLevel,solutionRevealed:assistance.solutionRevealed===1,questionId:ctx.question.id,questionVersion:ctx.question.version,contextKey:ctx.contextKey};
      const [attempt]=await tx.insert(attempts).values({ownerId,activityId:ctx.activity.id,attemptNumber:number.value+1,response:{answer:input.response},outcome:evaluation.outcome,output:evaluation,evaluatorVersion:QUESTION_EVALUATOR_VERSION,submissionKey:input.submissionKey,questionVersionId:ctx.versionId,context:conditions}).returning();
      const mapped=await tx.select().from(concepts).where(inArray(concepts.stableId,ctx.question.conceptIds));
      for(const concept of mapped){
        const history=await tx.select().from(conceptEvidence).where(and(eq(conceptEvidence.ownerId,ownerId),eq(conceptEvidence.conceptId,concept.id)));
        const delayedRetrieval=history.some(item=>item.createdAt.getTime()<=now.getTime()-86400000);
        const transfer=ctx.question.cognitiveOperations.includes("apply")&&["applied","ifsc","challenge"].includes(ctx.question.difficulty)&&history.some(item=>(item.conditions as Record<string,unknown>).questionId!==ctx.question.id);
        const mode=delayedRetrieval?"review" as const:"learn" as const;
        const event={...conditions,mode,delayedRetrieval,transfer};
        const strength=evidenceStrengthV2({correct:evaluation.correct,difficulty:ctx.question.difficulty,mode,hintLevel:assistance.hintLevel,solutionRevealed:assistance.solutionRevealed===1,questionId:ctx.question.id,delayedRetrieval,transfer,createdAt:now});
        await tx.insert(conceptEvidence).values({ownerId,conceptId:concept.id,attemptId:attempt.id,type:"question_result",strength,sourceType:"question_attempt",sourceId:attempt.id,conditions:event});
        const [previousReview]=await tx.select().from(reviewSchedules).where(and(eq(reviewSchedules.ownerId,ownerId),eq(reviewSchedules.conceptId,concept.id)));
        const stage=previousReview?.policyVersion===REVIEW_V2?Number((previousReview.metadata as Record<string,unknown>).stage??0):0;
        const schedule=delayedRetrieval?scheduleReviewV2({correct:evaluation.correct,independent:!assistance.hintLevel&&!assistance.solutionRevealed,stage,reviewedAt:now}):{stage:0,stabilityDays:1,nextReviewAt:new Date(now.getTime()+86400000),policyVersion:REVIEW_V2};
        await tx.insert(reviewSchedules).values({ownerId,conceptId:concept.id,currentMasteryState:evaluation.correct?"understood":"introduced",nextReviewAt:schedule.nextReviewAt,recentQuality:evaluation.correct?3:1,policyVersion:REVIEW_V2,metadata:{stage:schedule.stage,stabilityDays:schedule.stabilityDays}}).onConflictDoUpdate({target:[reviewSchedules.ownerId,reviewSchedules.conceptId],set:{nextReviewAt:schedule.nextReviewAt,lastReviewedAt:delayedRetrieval?now:previousReview?.lastReviewedAt,reviewCount:delayedRetrieval?sql`${reviewSchedules.reviewCount}+1`:sql`${reviewSchedules.reviewCount}`,recentQuality:evaluation.correct?3:1,policyVersion:REVIEW_V2,metadata:{stage:schedule.stage,stabilityDays:schedule.stabilityDays},updatedAt:now}});
        if(!evaluation.correct)await tx.insert(mistakes).values({ownerId,conceptId:concept.id,attemptId:attempt.id,category:ctx.question.type==="numeric"?"CALCULATION":"INTERPRETATION",summary:"Rever o raciocínio desta questão."});
      }
      await tx.insert(studyEvents).values({ownerId,type:"activity_submitted",entityType:"activity",entityId:ctx.activity.stableId,payload:{attemptId:attempt.id,outcome:evaluation.outcome,sessionId:input.sessionId??null}});
      await tx.update(questionAssistance).set({solutionRevealed:1,updatedAt:new Date()}).where(where);
      return {attemptId:attempt.id,correct:evaluation.correct,explanation:ctx.question.explanation};
    });
  }
}
