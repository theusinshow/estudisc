import { eq,sql } from "drizzle-orm";
import type { PgDatabase,PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import { lessonResumes,studyPlans } from "@/db/schema";
import type * as schema from "@/db/schema";
import { getMemoryStore } from "./memory/store";
export type LearningStateExport=Readonly<{routineAvailable:boolean;resumeAvailable:boolean;routine:unknown[];lessonResumes:unknown[]}>;
export class LearningStateExportRepository{
  constructor(private readonly db:PgDatabase<PgQueryResultHKT,typeof schema>=getDatabase()){}
  async get(ownerId:string):Promise<LearningStateExport>{
    const result=await this.db.execute(sql`SELECT to_regclass('public.study_plans') IS NOT NULL AS routine, to_regclass('public.lesson_resumes') IS NOT NULL AS resume`);
    const [availability]=(Array.isArray(result)?result:(result as unknown as {rows:Array<{routine:boolean;resume:boolean}>}).rows) as Array<{routine:boolean;resume:boolean}>;
    return {routineAvailable:availability.routine,resumeAvailable:availability.resume,routine:availability.routine?await this.db.select().from(studyPlans).where(eq(studyPlans.ownerId,ownerId)):[],lessonResumes:availability.resume?await this.db.select().from(lessonResumes).where(eq(lessonResumes.ownerId,ownerId)):[]};
  }
}
export class MemoryLearningStateExportRepository{
  constructor(private readonly store=getMemoryStore()){}
  async get(ownerId:string):Promise<LearningStateExport>{return {routineAvailable:true,resumeAvailable:true,routine:structuredClone(this.store.studyPlans.filter(r=>r.ownerId===ownerId)),lessonResumes:structuredClone(this.store.lessonResumes.filter(r=>r.ownerId===ownerId))};}
}
