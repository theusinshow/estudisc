import { and, eq, sql, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { attempts,owners,studySessions,conceptEvidence,concepts } from "@/db/schema";
import { sessionItemsSchema,type SessionItem } from "@/features/study-sessions/contracts";
import { planCandidates } from "@/features/study-sessions/planner-policy";
import { sqlAdaptiveChoices } from "./adaptive-session-data";
import { summarizeSession } from "@/features/study-sessions/session-summary";
import { TargetedPracticeError } from "@/features/study-sessions/targeted-selection";
import { PRACTICE_BLOCK_MINUTES, capBlockItems, practiceBlockPolicy, toBlockAnswer, type PracticeBlockTarget } from "@/features/study-sessions/practice-block";
import { sqlTargetedSelection } from "./targeted-session-selection";

type Database=PgDatabase<PgQueryResultHKT,typeof schema>;
export class SessionStateError extends Error{constructor(){super("Session state or ownership does not permit this action");}}
/** ADR 0072: study sessions are practice blocks; time-budget planning and the weekly routine are retired. */
export class StudySessionRepository{
  constructor(private readonly db:Database=getDatabase()){}
  /** A practice block is a targeted session of up to five Questions, created ACTIVE; the same target resumes it. */
  async startBlock(ownerId:string,target:PracticeBlockTarget,now=new Date()){
    return this.db.transaction(async tx=>{
      await tx.insert(owners).values({id:ownerId,displayName:"Private learner"}).onConflictDoNothing();
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const policyVersion=practiceBlockPolicy(target);
      const [open]=await tx.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.status,"ACTIVE")));
      const resumable=open?.policyVersion===policyVersion?open:undefined;
      let items:SessionItem[];
      // The same target resumes even when it is no longer due; an active EXAM blocks resuming as well.
      try{items=await this.blockItems(tx,ownerId,target,now);}catch(error){if(resumable&&error instanceof TargetedPracticeError&&error.code!=="exam_active")return resumable;throw error;}
      if(resumable)return resumable;
      if(!items.length)return null;
      // A different target replaces the open block (or a dormant legacy session); its Attempts keep counting.
      await tx.update(studySessions).set({status:"ABANDONED",endedAt:now}).where(and(eq(studySessions.ownerId,ownerId),inArray(studySessions.status,["ACTIVE","PLANNED"])));
      const [session]=await tx.insert(studySessions).values({ownerId,trackId:items[0].trackId!,status:"ACTIVE",budgetMinutes:PRACTICE_BLOCK_MINUTES,items,policyVersion,startedAt:now,createdAt:now}).returning();return session;
    });
  }
  /** "Mais 5": whether the same target still composes a block now; writes nothing. */
  async blockHasMore(ownerId:string,target:PracticeBlockTarget,now=new Date()){
    try{return (await this.blockItems(this.db,ownerId,target,now)).length>0;}catch(error){if(error instanceof TargetedPracticeError)return false;throw error;}
  }
  private async blockItems(db:Database,ownerId:string,target:PracticeBlockTarget,now:Date){
    const selection=await sqlTargetedSelection(db,ownerId,target,now);
    const data=await sqlAdaptiveChoices(db,ownerId,PRACTICE_BLOCK_MINUTES,now,selection);
    const plan=planCandidates(data.choices.map(choice=>choice.candidate),PRACTICE_BLOCK_MINUTES,"FOUNDATION",data.subjectMinutes,undefined,true);
    return capBlockItems(plan.items.map(candidate=>data.choices.find(choice=>choice.candidate.id===candidate.id)!.item));
  }
  async get(ownerId:string,id:string){const [row]=await this.db.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.id,id)));return row??null;}
  async transition(ownerId:string,id:string,action:"complete"|"abandon",now=new Date()){
    return this.db.transaction(async tx=>{
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const [session]=await tx.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.id,id))).for("update");
      if(!session)throw new SessionStateError();
      const target=action==="complete"?"COMPLETED":"ABANDONED";
      if(session.status===target)return session;
      if(session.status!=="ACTIVE")throw new SessionStateError();
      sessionItemsSchema.parse(session.items);
      const [updated]=await tx.update(studySessions).set({status:target,endedAt:now}).where(eq(studySessions.id,id)).returning();return updated;
    });
  }
  async result(ownerId:string,id:string){
    const session=await this.get(ownerId,id);if(!session)return null;
    const rows=await this.db.select().from(attempts).where(and(eq(attempts.ownerId,ownerId),sql`${attempts.context}->>'contextKey' = ${id}`)).orderBy(attempts.createdAt,attempts.attemptNumber);
    const unique=new Map(rows.map(row=>[row.questionVersionId,row]));
    const evidence=rows.length?await this.db.select({conceptId:concepts.stableId,title:concepts.title,strength:conceptEvidence.strength,conditions:conceptEvidence.conditions}).from(conceptEvidence).innerJoin(concepts,eq(concepts.id,conceptEvidence.conceptId)).where(and(eq(conceptEvidence.ownerId,ownerId),inArray(conceptEvidence.attemptId,rows.map(row=>row.id)))):[];
    const summary=summarizeSession(session,rows.map(row=>({key:row.questionVersionId??row.activityId??row.id,outcome:row.outcome})),evidence.map(fact=>({...fact,conditions:fact.conditions as Record<string,unknown>})));
    return {session,items:sessionItemsSchema.parse(session.items),attempts:rows.length,correct:[...unique.values()].filter(row=>row.outcome==="passed").length,answered:unique.size,summary,answers:rows.map(row=>toBlockAnswer(row.context,row.outcome))};
  }
}
