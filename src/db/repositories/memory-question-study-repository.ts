import { getMemoryStore } from "./memory-store";
import { QuestionUnavailableError, SubmissionConflictError, type QuestionStudyRepository } from "./question-study-repository";
import { questionSchema } from "@/features/questions/contracts";
import { canExposeQuestion } from "@/features/questions/exposure";
import { evaluateQuestion } from "@/features/questions/evaluation";
import { studentQuestion } from "@/features/questions/student-view";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { evidenceStrengthV2,MASTERY_V2 } from "@/features/mastery/mastery-policy-v2";
import { scheduleReviewV2,REVIEW_V2 } from "@/features/review/review-policy-v2";

export class MemoryQuestionStudyRepository {
  constructor(private readonly store=getMemoryStore()){}
  private context(ownerId:string,activityId:string,questionId:string,version:number,sessionId?:string){
    const activity=this.store.activities.find(activity=>activity.stableId===activityId);
    const config=questionReferenceSchema.safeParse(activity?.config);
    const input=this.store.packImports.flatMap(entry=>entry.manifest?.schema==="caderno.track.v2"?entry.manifest.questions:[]).find(question=>question.id===questionId&&question.version===version);
    const question=input?questionSchema.parse(input):null;
    if(!activity||activity.type!=="question"||!config.success||config.data.questionId!==questionId||config.data.questionVersion!==version||!question||!canExposeQuestion(question,{now:new Date(),context:"training"}))throw new QuestionUnavailableError();
    if(sessionId){const session=this.store.studySessions.find(session=>session.id===sessionId&&session.ownerId===ownerId);if(!session||session.status!=="ACTIVE"||!Array.isArray(session.items)||!session.items.some(item=>item.lessonId===activity.lessonStableId&&item.activityIds.includes(activity.stableId)&&item.questions.some((question:{id:string;version:number})=>question.id===questionId&&question.version===version)))throw new QuestionUnavailableError();}
    return {activity,question,config:config.data,contextKey:sessionId??`lesson:${activity.lessonStableId}`};
  }
  async view(ownerId:string,activityId:string,questionId:string,version:number,sessionId?:string){
    const ctx=this.context(ownerId,activityId,questionId,version,sessionId);
    const opened=this.store.questionAssistance.find(item=>item.ownerId===ownerId&&item.questionId===questionId&&item.version===version&&item.contextKey===ctx.contextKey);
    if(!opened){
      const exposure=this.store.questionExposures.find(item=>item.ownerId===ownerId&&item.questionId===questionId);
      if(!canExposeQuestion(ctx.question,{now:new Date(),context:"training",exposure}))throw new QuestionUnavailableError();
      this.store.questionAssistance.push({ownerId,questionId,version,contextKey:ctx.contextKey,hintLevel:0,solutionRevealed:false});
      if(exposure){exposure.timesSeen++;exposure.lastSeenAt=new Date();}else this.store.questionExposures.push({ownerId,questionId,lastSeenAt:new Date(),timesSeen:1});
    }
    const latest=[...this.store.attempts].reverse().find(item=>item.ownerId===ownerId&&item.activityStableId===activityId&&item.context?.contextKey===ctx.contextKey);
    return {question:studentQuestion(ctx.question),hints:ctx.config.hints,lastAnswer:latest?.response};
  }
  async interact(...[ownerId,activityId,input]:Parameters<QuestionStudyRepository["interact"]>){
    const ctx=this.context(ownerId,activityId,input.questionId,input.questionVersion,input.sessionId);
    const assistance=this.store.questionAssistance.find(item=>item.ownerId===ownerId&&item.questionId===input.questionId&&item.version===input.questionVersion&&item.contextKey===ctx.contextKey);
    if(!assistance)throw new QuestionUnavailableError();
    if(input.action==="hint"){assistance.hintLevel=Math.min(ctx.config.hints.length,assistance.hintLevel+1);return {hintLevel:assistance.hintLevel};}
    if(input.action==="solution"){assistance.solutionRevealed=true;return {correct:false,explanation:ctx.question.explanation};}
    const previous=this.store.attempts.find(attempt=>attempt.ownerId===ownerId&&attempt.submissionKey===input.submissionKey);
    if(previous){if(previous.activityStableId!==activityId||JSON.stringify(previous.response)!==JSON.stringify(input.response))throw new SubmissionConflictError();return {attemptId:previous.id,correct:previous.outcome==="passed",explanation:ctx.question.explanation};}
    const evaluation=evaluateQuestion(ctx.question,input.response); if(!evaluation.evidenceEligible)throw new QuestionUnavailableError();
    const id=crypto.randomUUID();const now=new Date();
    const conditions={policyVersion:MASTERY_V2,outcome:evaluation.outcome,hintLevel:assistance.hintLevel,solutionRevealed:assistance.solutionRevealed,difficulty:ctx.question.difficulty,mode:"learn",questionId:ctx.question.id,questionVersion:ctx.question.version,contextKey:ctx.contextKey};
    this.store.attempts.push({id,ownerId,activityStableId:activityId,attemptNumber:this.store.attempts.filter(item=>item.ownerId===ownerId&&item.activityStableId===activityId).length+1,outcome:evaluation.correct?"passed":"failed",source:JSON.stringify(input.response),response:input.response,submissionKey:input.submissionKey,context:conditions,createdAt:now,tests:[],output:{status:"completed",stdout:[],stderr:[],result:null,runtimeVersion:"question.v1",limits:{timeoutMs:0,outputLimit:0},capabilities:{dom:false,network:false,ambientSecrets:false}}});
    for(const conceptStableId of ctx.question.conceptIds){
      const history=this.store.conceptEvidence.filter(item=>item.ownerId===ownerId&&item.conceptStableId===conceptStableId);
      const delayedRetrieval=history.some(item=>item.createdAt.getTime()<=now.getTime()-86400000);
      const transfer=ctx.question.cognitiveOperations.includes("apply")&&["applied","ifsc","challenge"].includes(ctx.question.difficulty)&&history.some(item=>item.conditions.questionId!==ctx.question.id);
      const mode=delayedRetrieval?"review" as const:"learn" as const;
      this.store.conceptEvidence.push({id:crypto.randomUUID(),ownerId,conceptStableId,attemptId:id,type:"question_result",strength:evidenceStrengthV2({correct:evaluation.correct,difficulty:ctx.question.difficulty,mode,hintLevel:assistance.hintLevel,solutionRevealed:assistance.solutionRevealed,questionId:ctx.question.id,delayedRetrieval,transfer,createdAt:now}),sourceType:"question_attempt",sourceId:id,conditions:{...conditions,mode,delayedRetrieval,transfer},createdAt:now});
      const review=this.store.reviewSchedules.find(item=>item.ownerId===ownerId&&item.conceptStableId===conceptStableId);
      const schedule=delayedRetrieval?scheduleReviewV2({correct:evaluation.correct,independent:!assistance.hintLevel&&!assistance.solutionRevealed,stage:review?.metadata?.stage??0,reviewedAt:now}):{stage:0,stabilityDays:1,nextReviewAt:new Date(now.getTime()+86400000),policyVersion:REVIEW_V2};
      if(review){review.nextReviewAt=schedule.nextReviewAt;review.policyVersion=REVIEW_V2;review.metadata={stage:schedule.stage,stabilityDays:schedule.stabilityDays};if(delayedRetrieval){review.lastReviewedAt=now;review.reviewCount++;}}
      else this.store.reviewSchedules.push({ownerId,conceptStableId,currentMasteryState:evaluation.correct?"understood":"introduced",lastReviewedAt:null,nextReviewAt:schedule.nextReviewAt,reviewCount:0,recentQuality:evaluation.correct?3:1,policyVersion:REVIEW_V2,updatedAt:now,metadata:{stage:schedule.stage,stabilityDays:schedule.stabilityDays}});
      if(!evaluation.correct)this.store.mistakes.push({id:crypto.randomUUID(),ownerId,conceptStableId,attemptId:id,category:ctx.question.type==="numeric"?"CALCULATION":"INTERPRETATION",summary:"Rever o raciocínio desta questão.",status:"active",createdAt:now,resolvedAt:null});
    }
    assistance.solutionRevealed=true;
    return {attemptId:id,correct:evaluation.correct,explanation:ctx.question.explanation};
  }
}
