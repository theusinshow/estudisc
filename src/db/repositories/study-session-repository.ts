import { and, desc, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { activities,attempts,lessons,modules,owners,studySessions,tracks } from "@/db/schema";
import { sessionItemsSchema,STUDY_SESSION_POLICY,type SessionItem } from "@/features/study-sessions/contracts";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { QuestionStudyRepository } from "./question-study-repository";

type Database=PgDatabase<PgQueryResultHKT,typeof schema>;
export class SessionStateError extends Error{constructor(){super("Session state or ownership does not permit this action");}}
export class StudySessionRepository{
  constructor(private readonly db:Database=getDatabase()){}
  async plan(ownerId:string,budgetMinutes:15|30|60){
    return this.db.transaction(async tx=>{
      await tx.insert(owners).values({id:ownerId,displayName:"Private learner"}).onConflictDoNothing();
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const [open]=await tx.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.status,"ACTIVE")));
      if(open)return open;
      await tx.update(studySessions).set({status:"ABANDONED",endedAt:new Date()}).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.status,"PLANNED")));
      const candidates=await tx.select({lesson:lessons,subject:modules.subjectCode,trackId:tracks.id}).from(lessons).innerJoin(modules,eq(modules.id,lessons.moduleId)).innerJoin(tracks,eq(tracks.id,modules.trackId)).where(sql`${lessons.metadata}->>'status' = 'published'`).orderBy(desc(tracks.contentVersion),lessons.orderIndex);
      for(const row of candidates){
        const rows=await tx.select().from(activities).where(and(eq(activities.lessonId,row.lesson.id),eq(activities.type,"question"))).orderBy(activities.orderIndex);
        const available=[];
        for(const activity of rows){const config=questionReferenceSchema.safeParse(activity.config);if(!config.success)continue;try{if(await new QuestionStudyRepository(tx).isAvailable(ownerId,activity.stableId,config.data.questionId,config.data.questionVersion))available.push({activity,config:config.data});}catch(error){if(!(error instanceof Error)||error.message!=="Question unavailable")throw error;}}
        if(!available.length)continue;
        const selected=available.slice(0,budgetMinutes===15?3:6);
        const items:SessionItem[]=[{lessonId:row.lesson.stableId,version:row.lesson.contentVersion,title:row.lesson.title,subjectCode:row.subject??"",minutes:Math.min(budgetMinutes,35),activityIds:selected.map(item=>item.activity.stableId),questions:selected.map(item=>({id:item.config.questionId,version:item.config.questionVersion}))}];
        const [session]=await tx.insert(studySessions).values({ownerId,trackId:row.trackId,budgetMinutes,items,policyVersion:STUDY_SESSION_POLICY}).returning();return session;
      }
      return null;
    });
  }
  async get(ownerId:string,id:string){const [row]=await this.db.select().from(studySessions).where(and(eq(studySessions.ownerId,ownerId),eq(studySessions.id,id)));return row??null;}
  async list(ownerId:string){return this.db.select().from(studySessions).where(eq(studySessions.ownerId,ownerId)).orderBy(desc(studySessions.createdAt)).limit(15);}
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
