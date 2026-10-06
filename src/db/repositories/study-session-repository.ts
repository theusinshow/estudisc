import { and, desc, eq, sql, or, inArray, gte } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { activities,attempts,lessons,modules,owners,studySessions,tracks,conceptEvidence,lessonConcepts,conceptPrerequisites,trackConceptSettings,reviewSchedules,packImports,concepts } from "@/db/schema";
import { sessionItemsSchema,type SessionItem } from "@/features/study-sessions/contracts";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { QuestionStudyRepository } from "./question-study-repository";
import { planCandidates,examPhase,type PlannerCandidate } from "@/features/study-sessions/planner-policy";
import { calculateVersionedMastery } from "@/features/mastery/mastery-policy-v2";
import { StudyPlanRepository } from "./study-plan-repository";
import { assertRoutineBudget, assertRoutineStart } from "@/features/study-sessions/routine-session-constraints";

type Database=PgDatabase<PgQueryResultHKT,typeof schema>;
export class SessionStateError extends Error{constructor(){super("Session state or ownership does not permit this action");}}
export class StudySessionRepository{
  constructor(private readonly db:Database=getDatabase(),private readonly routineEnabled=false){}
  async plan(ownerId:string,budgetMinutes:15|30|60){
    return this.db.transaction(async tx=>{
      await tx.insert(owners).values({id:ownerId,displayName:"Private learner"}).onConflictDoNothing();
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const [open]=await tx.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.status,"ACTIVE")));
      if(open)return open;
      const subjectLimits=this.routineEnabled?assertRoutineBudget((await new StudyPlanRepository(tx).getState(ownerId)).week,budgetMinutes):undefined;
      const candidateRows=await tx.select({lesson:lessons,subject:modules.subjectCode,trackId:tracks.id,trackStableId:tracks.stableId,packImportId:tracks.packImportId}).from(lessons).innerJoin(modules,eq(modules.id,lessons.moduleId)).innerJoin(tracks,eq(tracks.id,modules.trackId)).where(sql`${lessons.metadata}->>'status' = 'published' AND ${lessons.metadata}->>'qaReleaseId' IS NOT NULL`).orderBy(desc(tracks.contentVersion),lessons.orderIndex);
      const seen=new Set<string>();const candidates=candidateRows.filter(row=>{const key=`${row.trackStableId}:${row.lesson.stableId}`;if(seen.has(key))return false;seen.add(key);return true;});
      const [facts,links,prerequisites,settings,reviews,history,manifests,conceptRows]=await Promise.all([tx.select().from(conceptEvidence).where(eq(conceptEvidence.ownerId,ownerId)),tx.select().from(lessonConcepts),tx.select().from(conceptPrerequisites),tx.select().from(trackConceptSettings),tx.select().from(reviewSchedules).where(eq(reviewSchedules.ownerId,ownerId)),tx.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.status,"COMPLETED"))),tx.select().from(packImports),tx.select().from(concepts)]);
      const subjectMinutes:Record<string,number>=Object.create(null);for(const session of history){if(!session.endedAt||session.endedAt.getTime()<Date.now()-7*86400000)continue;for(const item of sessionItemsSchema.parse(session.items))subjectMinutes[item.subjectCode]=(subjectMinutes[item.subjectCode]??0)+item.minutes;}
      const mastery=(conceptId:string)=>calculateVersionedMastery(facts.filter(item=>item.conceptId===conceptId).map(item=>({...item,conceptStableId:conceptId,conditions:item.conditions as Record<string,unknown>})));
      const choices:Array<{row:typeof candidates[number];item:SessionItem;candidate:PlannerCandidate}>=[];
      for(const row of candidates){
        const rows=await tx.select().from(activities).where(and(eq(activities.lessonId,row.lesson.id),eq(activities.type,"question"))).orderBy(activities.orderIndex);
        const available=[];
        for(const activity of rows){const config=questionReferenceSchema.safeParse(activity.config);if(!config.success)continue;try{if(await new QuestionStudyRepository(tx).isAvailable(ownerId,activity.stableId,config.data.questionId,config.data.questionVersion))available.push({activity,config:config.data});}catch(error){if(!(error instanceof Error)||error.message!=="Question unavailable")throw error;}}
        if(!available.length)continue;
        const candidateBudget=subjectLimits?Math.min(budgetMinutes,subjectLimits[row.subject??""]??0):budgetMinutes;
        if(candidateBudget<15)continue;
        const selected=available.slice(0,candidateBudget<=15?3:6);
        const minutes=Math.min(candidateBudget,Math.max(15,Math.min(30,Number((row.lesson.metadata as Record<string,unknown>).estimatedMinutes??30))));
        const conceptIds=links.filter(link=>link.lessonId===row.lesson.id).map(link=>link.conceptId);
        const due=reviews.filter(review=>conceptIds.includes(review.conceptId)&&review.nextReviewAt.getTime()<=Date.now());
        const required=prerequisites.filter(edge=>edge.trackId===row.trackId&&conceptIds.includes(edge.conceptId)&&edge.strength==="required"&&!conceptIds.includes(edge.prerequisiteConceptId));
        const declared=(row.lesson.metadata as {prerequisiteConceptIds?:string[]}).prerequisiteConceptIds??[];
        const requiredPrerequisitesReady=required.every(edge=>mastery(edge.prerequisiteConceptId).level>=2)&&declared.every(id=>{const concept=conceptRows.find(concept=>concept.stableId===id);return concept&&mastery(concept.id).level>=2;});
        const levels=conceptIds.map(id=>mastery(id).level);const hasEvidence=facts.some(fact=>conceptIds.includes(fact.conceptId));
        const importance=Math.max(1,...settings.filter(setting=>setting.trackId===row.trackId&&conceptIds.includes(setting.conceptId)).map(setting=>({low:1,medium:2,high:3,critical:4})[setting.importance as "low"|"medium"|"high"|"critical"]??1));
        const item:SessionItem={lessonId:row.lesson.stableId,version:row.lesson.contentVersion,title:row.lesson.title,subjectCode:row.subject??"",minutes,activityIds:selected.map(item=>item.activity.stableId),questions:selected.map(item=>({id:item.config.questionId,version:item.config.questionVersion}))};
        choices.push({row,item,candidate:{id:row.lesson.id,subjectCode:item.subjectCode,kind:due.length?"review":hasEvidence?"practice":"learn",minutes,importance,weakness:levels.length?1-levels.reduce((sum,level)=>sum+level,0)/levels.length/5:1,dueDays:Math.max(0,...due.map(review=>(Date.now()-review.nextReviewAt.getTime())/86400000)),requiredPrerequisitesReady,plannerReady:true,reserved:false}});
      }
      // An exam date belongs to track configuration; never bake a specific exam date into policy.
      const manifest=manifests.find(pack=>pack.id===choices[0]?.row.packImportId)?.manifest as {track?:{metadata?:{examDate?:string}}}|undefined;
      const deadline=manifest?.track?.metadata?.examDate;
      const phase=deadline&&Number.isFinite(Date.parse(deadline))?examPhase(new Date(),new Date(deadline)):"FOUNDATION";
      const plan=planCandidates(choices.map(choice=>choice.candidate),budgetMinutes,phase,subjectMinutes,subjectLimits);
      if(!plan.items.length)return null;
      const trackId=choices.find(choice=>choice.candidate.id===plan.items[0].id)!.row.trackId;
      const sameTrack=planCandidates(choices.filter(choice=>choice.row.trackId===trackId).map(choice=>choice.candidate),budgetMinutes,phase,subjectMinutes,subjectLimits);
      const items=sameTrack.items.map(item=>choices.find(choice=>choice.candidate.id===item.id)!.item);
      await tx.update(studySessions).set({status:"ABANDONED",endedAt:new Date()}).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.status,"PLANNED")));
      const [session]=await tx.insert(studySessions).values({ownerId,trackId,budgetMinutes,items,policyVersion:plan.policyVersion}).returning();return session;
    });
  }
  async get(ownerId:string,id:string){const [row]=await this.db.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.id,id)));return row??null;}
  async list(ownerId:string){return this.db.select().from(studySessions).where(eq(studySessions.ownerId,ownerId)).orderBy(desc(studySessions.createdAt)).limit(15);}
  async planningFacts(ownerId:string,now=new Date()){return this.db.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),or(inArray(studySessions.status,["ACTIVE","PLANNED"]),and(eq(studySessions.status,"COMPLETED"),gte(studySessions.endedAt,new Date(now.getTime()-9*86400_000)))))).orderBy(desc(studySessions.createdAt));}
  async transition(ownerId:string,id:string,action:"start"|"complete"|"abandon"){
    return this.db.transaction(async tx=>{
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const [session]=await tx.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.id,id))).for("update");
      if(!session)throw new SessionStateError();
      const target=action==="start"?"ACTIVE":action==="complete"?"COMPLETED":"ABANDONED";
      if(session.status===target)return session;
      if(action==="start"?session.status!=="PLANNED":session.status!=="ACTIVE")throw new SessionStateError();
      if(action==="start"){const [active]=await tx.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.status,"ACTIVE")));if(active)throw new SessionStateError();}
      sessionItemsSchema.parse(session.items);
      if(action==="start"&&this.routineEnabled)assertRoutineStart((await new StudyPlanRepository(tx).getState(ownerId)).week,session.items);
      const [updated]=await tx.update(studySessions).set({status:target,...action==="start"?{startedAt:new Date()}:{endedAt:new Date()}}).where(eq(studySessions.id,id)).returning();return updated;
    });
  }
  async result(ownerId:string,id:string){
    const session=await this.get(ownerId,id);if(!session)return null;
    const rows=await this.db.select().from(attempts).where(and(eq(attempts.ownerId,ownerId),sql`${attempts.context}->>'contextKey' = ${id}`)).orderBy(attempts.createdAt,attempts.attemptNumber);
    const unique=new Map(rows.map(row=>[row.questionVersionId,row]));
    return {session,items:sessionItemsSchema.parse(session.items),attempts:rows.length,correct:[...unique.values()].filter(row=>row.outcome==="passed").length,answered:unique.size};
  }
}
