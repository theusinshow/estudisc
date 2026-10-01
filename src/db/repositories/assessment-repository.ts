import { createHash,randomUUID } from "node:crypto";
import { and,desc,eq,inArray,sql } from "drizzle-orm";
import type { PgDatabase,PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { assessmentInstances,assessmentResponses,assessmentTemplates,attempts,conceptEvidence,concepts,mistakes,owners,questionExposures,questionVersions,reviewSchedules,studyEvents,tracks,trackConceptSettings } from "@/db/schema";
import { assessmentSnapshotSchema,assessmentTemplateSchema,ASSESSMENT_POLICY,validateAssessmentComposition } from "@/features/assessments/contracts";
import { scoreAssessment,assessmentFeedback,diagnosticSignals } from "@/features/assessments/scoring";
import { studentQuestion } from "@/features/questions/student-view";
import { evidenceStrengthV2,MASTERY_V2 } from "@/features/mastery/mastery-policy-v2";
import { REVIEW_V2,scheduleReviewV2 } from "@/features/review/review-policy-v2";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { DrizzleQuestionRepository } from "./question-repository";

type Database=PgDatabase<PgQueryResultHKT,typeof schema>;
export class AssessmentStateError extends Error {constructor(){super("Assessment unavailable or closed");}}
export class AssessmentRepository{
  constructor(private readonly db:Database=getDatabase()){}
  private async assertTrackScope(trackId:string,conceptIds:readonly string[]){const members=await this.db.select({stableId:concepts.stableId}).from(trackConceptSettings).innerJoin(tracks,eq(tracks.id,trackConceptSettings.trackId)).innerJoin(concepts,eq(concepts.id,trackConceptSettings.conceptId)).where(eq(tracks.stableId,trackId));const ids=new Set(members.map(row=>row.stableId));if(conceptIds.some(id=>!ids.has(id)))throw new AssessmentStateError();}
  async importTemplate(input:unknown){
    const template=assessmentTemplateSchema.parse(input);const questions=[];
    for(const ref of template.items){const item=await new DrizzleQuestionRepository(this.db).getVersion(ref.id,ref.version);if(!item)throw new AssessmentStateError();questions.push(item.question);}
    validateAssessmentComposition(template,questions);
    await this.assertTrackScope(template.trackId,questions.flatMap(question=>question.conceptIds));
    const contentHash=hashCanonicalJson(template);
    const [created]=await this.db.insert(assessmentTemplates).values({stableId:template.id,version:template.version,kind:template.kind,status:template.status,contentHash,definition:template}).onConflictDoNothing().returning();
    if(created)return created;
    const [existing]=await this.db.select().from(assessmentTemplates).where(and(eq(assessmentTemplates.stableId,template.id),eq(assessmentTemplates.version,template.version)));
    if(existing?.contentHash!==contentHash)throw new Error("Assessment template version conflict");return existing;
  }
  async listTemplates(){return this.db.select({id:assessmentTemplates.id,stableId:assessmentTemplates.stableId,version:assessmentTemplates.version,kind:assessmentTemplates.kind,definition:assessmentTemplates.definition}).from(assessmentTemplates).where(eq(assessmentTemplates.status,"published")).orderBy(assessmentTemplates.stableId,desc(assessmentTemplates.version));}
  async list(ownerId:string){return this.db.select({id:assessmentInstances.id,status:assessmentInstances.status,mode:assessmentInstances.mode,startedAt:assessmentInstances.startedAt,deadlineAt:assessmentInstances.deadlineAt,result:assessmentInstances.result}).from(assessmentInstances).where(eq(assessmentInstances.ownerId,ownerId)).orderBy(desc(assessmentInstances.startedAt)).limit(20);}
  async start(ownerId:string,templateId:string,startKey:string,now=new Date()){
    return this.db.transaction(async tx=>{
      await tx.insert(owners).values({id:ownerId,displayName:"Private learner"}).onConflictDoNothing();
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const [existing]=await tx.select().from(assessmentInstances).where(and(eq(assessmentInstances.ownerId,ownerId),eq(assessmentInstances.startKey,startKey)));
      if(existing){if(existing.templateId!==templateId)throw new AssessmentStateError();return {id:existing.id};}
      const [active]=await tx.select().from(assessmentInstances).where(and(eq(assessmentInstances.ownerId,ownerId),eq(assessmentInstances.status,"ACTIVE")));
      if(active){if(active.templateId!==templateId)throw new AssessmentStateError();return {id:active.id};}
      const [row]=await tx.select().from(assessmentTemplates).where(eq(assessmentTemplates.id,templateId));if(!row||row.status!=="published")throw new AssessmentStateError();
      const template=assessmentTemplateSchema.parse(row.definition);if(template.availableAt&&now.getTime()<Date.parse(template.availableAt))throw new AssessmentStateError();
      const id=randomUUID();const frozen=[];
      for(const ref of template.items){const bank=await new DrizzleQuestionRepository(tx).getVersion(ref.id,ref.version);if(!bank)throw new AssessmentStateError();
        const [identity]=await tx.select().from(questionVersions).where(eq(questionVersions.id,bank.versionId));const [exposure]=await tx.select().from(questionExposures).where(and(eq(questionExposures.ownerId,ownerId),eq(questionExposures.questionId,identity.questionId)));
        if(!bank.question.exposurePolicy.reservedForAssessment&&exposure&&now.getTime()-exposure.lastSeenAt.getTime()<bank.question.exposurePolicy.minimumDaysBetween*86400000)throw new AssessmentStateError();
        const choiceOrder=(bank.question.choices??[]).map(choice=>choice.id);if(template.shuffleChoices)choiceOrder.sort((a,b)=>createHash("sha256").update(`${id}:${ref.id}:${a}`).digest("hex").localeCompare(createHash("sha256").update(`${id}:${ref.id}:${b}`).digest("hex")));
        frozen.push({versionId:bank.versionId,question:bank.question,choiceOrder});
        await tx.insert(questionExposures).values({ownerId,questionId:identity.questionId,firstSeenAt:now,lastSeenAt:now,timesSeen:1,lastContext:"assessment"}).onConflictDoUpdate({target:[questionExposures.ownerId,questionExposures.questionId],set:{lastSeenAt:now,timesSeen:sql`${questionExposures.timesSeen}+1`,lastContext:"assessment"}});
      }
      validateAssessmentComposition(template,frozen.map(item=>item.question),true);
      await new AssessmentRepository(tx).assertTrackScope(template.trackId,frozen.flatMap(item=>item.question.conceptIds));
      const mode=template.kind==="FULL_SIMULATION"||template.kind==="OFFICIAL_EXAM"?"EXAM":"ASSESSMENT";
      const snapshot=assessmentSnapshotSchema.parse({kind:template.kind,mode,questions:frozen,durationMinutes:template.durationMinutes,policyVersion:ASSESSMENT_POLICY,masteryPolicy:MASTERY_V2,reviewPolicy:REVIEW_V2});
      await tx.insert(assessmentInstances).values({id,ownerId,templateId,startKey,mode,snapshot,startedAt:now,deadlineAt:new Date(now.getTime()+template.durationMinutes*60000)});return {id};
    });
  }
  async view(ownerId:string,id:string){
    const [instance]=await this.db.select().from(assessmentInstances).where(and(eq(assessmentInstances.id,id),eq(assessmentInstances.ownerId,ownerId)));if(!instance)return null;
    const snapshot=assessmentSnapshotSchema.parse(instance.snapshot);const responses=await this.db.select().from(assessmentResponses).where(eq(assessmentResponses.instanceId,id));
    return {serverNow:Date.now(),id:instance.id,status:instance.status,mode:snapshot.mode,kind:snapshot.kind,startedAt:instance.startedAt.toISOString(),deadlineAt:instance.deadlineAt.toISOString(),questions:snapshot.questions.map(item=>{const question=studentQuestion(item.question);return {versionId:item.versionId,question:{...question,choices:question.choices?[...question.choices].sort((a,b)=>item.choiceOrder.indexOf(a.id)-item.choiceOrder.indexOf(b.id)):undefined}};}),responses:responses.map(row=>({versionId:row.questionVersionId,response:(row.response as {answer:unknown}).answer,flagged:row.flagged===1})),result:instance.status==="FINALIZED"?instance.result:null};
  }
  async save(ownerId:string,id:string,versionId:string,response:unknown,flagged:boolean,now=new Date()){
    return this.db.transaction(async tx=>{
      const [instance]=await tx.select().from(assessmentInstances).where(and(eq(assessmentInstances.id,id),eq(assessmentInstances.ownerId,ownerId))).for("update");
      if(!instance||instance.status!=="ACTIVE"||now.getTime()>instance.deadlineAt.getTime())throw new AssessmentStateError();
      const snapshot=assessmentSnapshotSchema.parse(instance.snapshot);if(!snapshot.questions.some(item=>item.versionId===versionId))throw new AssessmentStateError();
      await tx.insert(assessmentResponses).values({instanceId:id,questionVersionId:versionId,response:{answer:response},flagged:flagged?1:0,firstAnsweredAt:now,updatedAt:now}).onConflictDoUpdate({target:[assessmentResponses.instanceId,assessmentResponses.questionVersionId],set:{response:{answer:response},flagged:flagged?1:0,updatedAt:now}});return {saved:true};
    });
  }
  async finalize(ownerId:string,id:string,now=new Date()){
    return this.db.transaction(async tx=>{
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const [instance]=await tx.select().from(assessmentInstances).where(and(eq(assessmentInstances.id,id),eq(assessmentInstances.ownerId,ownerId))).for("update");if(!instance)throw new AssessmentStateError();if(instance.status==="FINALIZED")return instance.result;
      if(instance.status!=="ACTIVE")throw new AssessmentStateError();
      const snapshot=assessmentSnapshotSchema.parse(instance.snapshot);const responses=await tx.select().from(assessmentResponses).where(eq(assessmentResponses.instanceId,id));
      const scored=scoreAssessment(snapshot,new Map(responses.map(row=>[row.questionVersionId,(row.response as {answer:unknown}).answer])));
      const conceptRows=await tx.select().from(concepts).where(inArray(concepts.stableId,scored.items.flatMap(item=>item.question.conceptIds)));
      for(const [index,item] of scored.items.entries()){
        const [attempt]=await tx.insert(attempts).values({ownerId,questionVersionId:item.versionId,attemptNumber:index+1,response:{answer:item.response},outcome:item.evaluation.outcome,output:item.evaluation,evaluatorVersion:"question.v1",submissionKey:`assessment:${id}:${item.versionId}`,context:{assessmentId:id,mode:snapshot.mode,policyVersion:ASSESSMENT_POLICY,questionId:item.question.id,questionVersion:item.question.version}}).returning();
        if(!item.evaluation.evidenceEligible)continue;
        for(const conceptId of item.question.conceptIds){
          const concept=conceptRows.find(concept=>concept.stableId===conceptId);if(!concept)throw new Error("Frozen assessment Concept is missing");
          const history=await tx.select().from(conceptEvidence).where(and(eq(conceptEvidence.ownerId,ownerId),eq(conceptEvidence.conceptId,concept.id)));
          const delayedRetrieval=history.some(event=>event.createdAt.getTime()<=now.getTime()-86400000);const transfer=item.question.cognitiveOperations.includes("apply")&&history.some(event=>typeof (event.conditions as Record<string,unknown>).questionId==="string"&&(event.conditions as Record<string,unknown>).questionId!==item.question.id);
          const conditions={policyVersion:MASTERY_V2,outcome:item.evaluation.outcome,difficulty:item.question.difficulty,mode:"assessment",hintLevel:0,solutionRevealed:false,questionId:item.question.id,questionVersion:item.question.version,delayedRetrieval,transfer,assessmentId:id};
          await tx.insert(conceptEvidence).values({ownerId,conceptId:concept.id,attemptId:attempt.id,type:"assessment_result",strength:evidenceStrengthV2({correct:item.evaluation.correct,difficulty:item.question.difficulty,mode:"assessment",hintLevel:0,solutionRevealed:false,questionId:item.question.id,delayedRetrieval,transfer,createdAt:now}),sourceType:"assessment_attempt",sourceId:attempt.id,conditions});
          const [review]=await tx.select().from(reviewSchedules).where(and(eq(reviewSchedules.ownerId,ownerId),eq(reviewSchedules.conceptId,concept.id)));
          const schedule=delayedRetrieval?scheduleReviewV2({correct:item.evaluation.correct,independent:true,stage:Number((review?.metadata as {stage?:number}|undefined)?.stage??0),reviewedAt:now}):{stage:0,stabilityDays:1,nextReviewAt:new Date(now.getTime()+86400000)};
          await tx.insert(reviewSchedules).values({ownerId,conceptId:concept.id,currentMasteryState:item.evaluation.correct?"understood":"introduced",nextReviewAt:schedule.nextReviewAt,policyVersion:REVIEW_V2,metadata:{stage:schedule.stage,stabilityDays:schedule.stabilityDays}}).onConflictDoUpdate({target:[reviewSchedules.ownerId,reviewSchedules.conceptId],set:{nextReviewAt:schedule.nextReviewAt,policyVersion:REVIEW_V2,metadata:{stage:schedule.stage,stabilityDays:schedule.stabilityDays},updatedAt:now}});
          if(!item.evaluation.correct)await tx.insert(mistakes).values({ownerId,conceptId:concept.id,attemptId:attempt.id,category:item.question.type==="numeric"?"CALCULATION":item.question.choices?.find(choice=>choice.id===item.response)?.targetsError?.toUpperCase()??"UNKNOWN",summary:"Rever o conceito identificado na avaliação."});
        }
      }
      const result={correct:scored.correct,scored:scored.scored,total:scored.total,bySubject:scored.bySubject,diagnostic:diagnosticSignals(scored.items),policyVersion:ASSESSMENT_POLICY,finishedAfterDeadline:now.getTime()>instance.deadlineAt.getTime(),items:scored.items.map(item=>({versionId:item.versionId,questionId:item.question.id,...assessmentFeedback(item.question,item.evaluation.outcome),outcome:item.evaluation.outcome,explanation:item.question.explanation,conceptIds:item.question.conceptIds}))};
      await tx.update(assessmentInstances).set({status:"FINALIZED",result,finalizedAt:now}).where(eq(assessmentInstances.id,id));
      await tx.insert(studyEvents).values({ownerId,type:"assessment_finalized",entityType:"assessment",entityId:id,payload:{correct:result.correct,scored:result.scored,policyVersion:ASSESSMENT_POLICY}});return result;
    });
  }
}
