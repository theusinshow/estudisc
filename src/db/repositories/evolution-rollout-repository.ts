import { sql } from "drizzle-orm";
import type { PgDatabase,PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { studyEvents } from "@/db/schema";
import artifact from "@/db/evolution-rollout-artifact.json";
import { hashCanonicalJson } from "@/lib/canonical-json";

type Database=PgDatabase<PgQueryResultHKT,typeof schema>;
type Row=Record<string,unknown>;
function rows(result:unknown):Row[]{return Array.isArray(result)?result:(result as {rows:Row[]}).rows;}
function shapeQuery(table:string){const values=[`public.${table}`,table];return sql.join(artifact.shapeSql.split(/(\$[12])/).map(part=>/^\$[12]$/.test(part)?sql`${values[Number(part.slice(1))-1]}`:sql.raw(part)),sql.raw(""));}
export class RolloutConflictError extends Error{}
export const evolutionRolloutIdentity={migrationSet:artifact.id,hash:artifact.hash,target:"vecta-three.vercel.app"} as const;

export class EvolutionRolloutRepository{
  constructor(private readonly db:Database=getDatabase()){}
  async readiness(){
    const baseline=rows(await this.db.execute(sql`SELECT to_regclass('public.owners') IS NOT NULL AND to_regclass('public.content_publication_events') IS NOT NULL AND to_regclass('public.study_events') IS NOT NULL AS ready`))[0].ready===true;
    const tables: Array<{name:string;state:"missing"|"ready"|"drift"}>=[];
    for(const migration of artifact.migrations)for(const table of migration.tables){
      const actual=rows(await this.db.execute(shapeQuery(table)))[0].shape as {columns:unknown};
      const expected=(migration.shapes as Record<string,unknown>)[table];
      tables.push({name:table,state:!actual.columns?"missing":hashCanonicalJson(actual)===hashCanonicalJson(expected)?"ready":"drift"});
    }
    const partial=artifact.migrations.some(m=>{const states=tables.filter(t=>m.tables.includes(t.name));return states.some(t=>t.state==="missing")&&states.some(t=>t.state!=="missing");});
    return {...evolutionRolloutIdentity,baseline,tables,ready:baseline&&tables.every(t=>t.state==="ready"),canApply:baseline&&!partial&&tables.every(t=>t.state!=="drift")};
  }
  async activate(ownerId:string){return this.db.transaction(async tx=>{
    await tx.execute(sql`SELECT pg_advisory_xact_lock(731804020)`);
    const repo=new EvolutionRolloutRepository(tx as never),before=await repo.readiness();
    if(!before.canApply)throw new RolloutConflictError("Schema baseline, partial addition or drift prevents activation");
    if(before.ready)return {...before,applied:[]};
    const journalExists=rows(await tx.execute(sql`SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS present`))[0].present===true;
    let journalLatest=0;
    if(journalExists){journalLatest=Number(rows(await tx.execute(sql`SELECT coalesce(max(created_at),0) AS latest FROM drizzle.__drizzle_migrations`))[0].latest);if(journalLatest<1791224955423)throw new RolloutConflictError("Migration journal baseline is not established");}
    const applied:string[]=[];
    for(const migration of artifact.migrations){
      if(!before.tables.some(t=>migration.tables.includes(t.name)&&t.state==="missing"))continue;
      if(journalExists&&journalLatest>=migration.when)throw new RolloutConflictError("Journal claims an absent migration table");
      for(const statement of migration.sql.split("--> statement-breakpoint").filter(s=>s.trim()))await tx.execute(sql.raw(statement));
      if(journalExists)await tx.execute(sql`INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES(${migration.hash},${migration.when})`);
      applied.push(migration.name);
    }
    const after=await repo.readiness();if(!after.ready)throw new RolloutConflictError("Exact post-migration shape verification failed");
    await tx.insert(studyEvents).values({ownerId,type:"evolution_schema_activation",entityType:"schema_rollout",entityId:artifact.id,payload:{artifactHash:artifact.hash,applied,migrationHashes:artifact.migrations.filter(m=>applied.includes(m.name)).map(m=>({name:m.name,hash:m.hash})),journalUpdated:journalExists,canonicalEvidence:false},occurredAt:new Date()});
    return {...after,applied};
  });}
}
