import { and, desc, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { getDatabase } from "@/db/connection";
import { concepts, mistakes, owners, studyEvents } from "@/db/schema";
import { mistakeReflectionPayloadSchema, mistakeReflectionSchema, type MistakeReflection, type MistakeReflectionInput } from "@/features/mistakes/reflection-contracts";
import type * as schema from "@/db/schema";

type MistakeDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type MistakeRecord = Readonly<{
  id: string;
  conceptStableId: string;
  conceptTitle: string;
  attemptId: string;
  category: string;
  summary: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}>;

export class MistakeRepository {
  constructor(private readonly db: MistakeDatabase = getDatabase()) {}

  async recordReflection(ownerId:string,input:MistakeReflectionInput){
    const data=mistakeReflectionSchema.parse(input);
    return this.db.transaction(async tx=>{
      await tx.select().from(owners).where(eq(owners.id,ownerId)).for("update");
      const [owned]=await tx.select({id:mistakes.id}).from(mistakes).where(and(eq(mistakes.ownerId,ownerId),eq(mistakes.id,data.mistakeId))).limit(1);
      if(!owned)throw new Error("Mistake unavailable");
      const payload={...data,basis:"student_report" as const,canonicalEvidence:false as const};
      const [existing]=await tx.select().from(studyEvents).where(and(eq(studyEvents.ownerId,ownerId),eq(studyEvents.type,"mistake_reflection"),sql`${studyEvents.payload}->>'mutationId'=${data.mutationId}`)).limit(1);
      if(existing){if(JSON.stringify(mistakeReflectionPayloadSchema.parse(existing.payload))!==JSON.stringify(payload))throw new Error("Reflection conflict");return existing.id;}
      const [event]=await tx.insert(studyEvents).values({ownerId,type:"mistake_reflection",entityType:"mistake",entityId:data.mistakeId,payload}).returning({id:studyEvents.id});return event.id;
    });
  }
  async listReflections(ownerId:string):Promise<MistakeReflection[]>{
    const rows=await this.db.select().from(studyEvents).where(and(eq(studyEvents.ownerId,ownerId),eq(studyEvents.type,"mistake_reflection"))).orderBy(desc(studyEvents.occurredAt));
    return rows.flatMap(row=>{const parsed=mistakeReflectionPayloadSchema.safeParse(row.payload);return parsed.success?[{id:row.id,mistakeId:parsed.data.mistakeId,category:parsed.data.category,note:parsed.data.note,createdAt:row.occurredAt}]:[];});
  }

  async listMistakes(ownerId: string): Promise<MistakeRecord[]> {
    const rows = await this.db
      .select({
        id: mistakes.id,
        conceptStableId: concepts.stableId,
        conceptTitle: concepts.title,
        attemptId: mistakes.attemptId,
        category: mistakes.category,
        summary: mistakes.summary,
        status: mistakes.status,
        createdAt: mistakes.createdAt,
        resolvedAt: mistakes.resolvedAt
      })
      .from(mistakes)
      .innerJoin(concepts, eq(concepts.id, mistakes.conceptId))
      .where(eq(mistakes.ownerId, ownerId))
      .orderBy(desc(mistakes.createdAt));

    return rows;
  }
}
