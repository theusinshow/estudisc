// @vitest-environment node
import { afterEach,describe,expect,it } from "vitest";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { owners,studyEvents,studyPlans,lessonResumes } from "@/db/schema";
import { EvolutionRolloutRepository } from "@/db/repositories/evolution-rollout-repository";
import { LearningStateExportRepository,MemoryLearningStateExportRepository } from "@/db/repositories/learning-state-export-repository";
import { MemoryExportRepository } from "@/db/repositories/memory/exports";
import { getMemoryStore } from "@/db/repositories/memory/store";
import artifact from "@/db/evolution-rollout-artifact.json";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
let fixture:Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>>|undefined;
afterEach(async()=>{await fixture?.close();fixture=undefined;});
async function baseline(){fixture=await createMigratedPgliteTestDatabase();const db=fixture.db;await db.insert(owners).values({id:"actual-admin",displayName:"Disposable Admin"});await db.execute(sql`DROP TABLE lesson_resumes, study_plan_previews, study_plans`);return db;}
describe("fixed additive evolution activation",()=>{
 it("pins the actual checked-in migration bytes and artifact identity",async()=>{
  for(const m of artifact.migrations)expect(createHash("sha256").update((await readFile(`src/db/migrations/${m.name}.sql`,"utf8")).replaceAll("\r\n","\n")).digest("hex")).toBe(m.hash);
  expect(createHash("sha256").update(JSON.stringify(artifact.migrations)).digest("hex")).toBe(artifact.hash);
 });
 it("creates only missing empty user-state tables, validates exact shape and retries without another event",async()=>{
  const db=await baseline(),repo=new EvolutionRolloutRepository(db as never);
  expect(await new LearningStateExportRepository(db as never).get("actual-admin")).toMatchObject({routineAvailable:false,resumeAvailable:false,routine:[],lessonResumes:[]});
  expect(await repo.readiness()).toMatchObject({baseline:true,ready:false,canApply:true});
  expect(await repo.activate("actual-admin")).toMatchObject({ready:true,applied:artifact.migrations.map(m=>m.name)});
  expect(await repo.activate("actual-admin")).toMatchObject({ready:true,applied:[]});
  const events=await db.select().from(studyEvents);expect(events).toHaveLength(1);expect(events[0]).toMatchObject({ownerId:"actual-admin",type:"evolution_schema_activation",payload:{canonicalEvidence:false,journalUpdated:false}});
  expect(await db.select().from(studyPlans)).toEqual([]);expect(await db.select().from(lessonResumes)).toEqual([]);
 });
 it("rejects partial/drifted schemas and rolls back additions if the actual actor cannot be recorded",async()=>{
  const db=await baseline(),repo=new EvolutionRolloutRepository(db as never);
  await expect(repo.activate("nonexistent-owner")).rejects.toThrow();expect((await repo.readiness()).tables.every(t=>t.state==="missing")).toBe(true);
  await db.execute(sql.raw(artifact.migrations[0].sql.split("--> statement-breakpoint")[0]));
  await expect(repo.activate("actual-admin")).rejects.toThrow("partial");
  await db.execute(sql`DROP TABLE study_plan_previews`);await repo.activate("actual-admin");
  await db.execute(sql`ALTER TABLE lesson_resumes ALTER COLUMN data DROP NOT NULL`);
  expect((await repo.readiness()).tables.find(t=>t.name==="lesson_resumes")?.state).toBe("drift");await expect(repo.activate("actual-admin")).rejects.toThrow("drift");
  await db.execute(sql`ALTER TABLE lesson_resumes ALTER COLUMN data SET NOT NULL`);
  await db.execute(sql`ALTER TABLE lesson_resumes ADD COLUMN unknown_data text`);
  expect((await repo.readiness()).tables.find(t=>t.name==="lesson_resumes")?.state).toBe("drift");await expect(repo.activate("actual-admin")).rejects.toThrow("drift");
 });
 it("preserves an established Drizzle journal using the original migration hashes/timestamps",async()=>{
  const db=await baseline();await db.execute(sql`CREATE SCHEMA drizzle`);await db.execute(sql`CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY,hash text NOT NULL,created_at bigint)`);await db.execute(sql`INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES ('baseline',1791224955423)`);
  await new EvolutionRolloutRepository(db as never).activate("actual-admin");
  const result=await db.execute(sql`SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`);expect(result.rows.slice(1)).toEqual(artifact.migrations.map(m=>({hash:m.hash,created_at:m.when})));
 });
});
it("exports routine/resume facts and history only for the actual owner in SQL and memory",async()=>{
 fixture=await createMigratedPgliteTestDatabase();const db=fixture.db;await db.insert(owners).values([{id:"a",displayName:"A"},{id:"b",displayName:"B"}]);
 for(const ownerId of ["a","b"]){await db.insert(studyPlans).values({ownerId,revision:1,settings:{privateOwner:ownerId}});await db.insert(lessonResumes).values({ownerId,contextKey:"lesson",trackId:"track",lessonId:"lesson",version:1,revision:1,mutationId:"00000000-0000-4000-8000-000000000001",mutationHash:"fixture",data:{privateOwner:ownerId}});}
 const state=await new LearningStateExportRepository(db as never).get("a");expect(state.routine).toHaveLength(1);expect(state.lessonResumes).toHaveLength(1);expect(JSON.stringify(state)).not.toContain('"privateOwner":"b"');
 const store=structuredClone(getMemoryStore());store.studyPlans=[{ownerId:"a",revision:1,settings:{privateOwner:"a"},updatedAt:new Date()},{ownerId:"b",revision:1,settings:{privateOwner:"b"},updatedAt:new Date()}];store.lessonResumes=[];store.events=[{id:"a",ownerId:"a",type:"test",entityType:"test",entityId:"a",payload:{},occurredAt:new Date()},{id:"b",ownerId:"b",type:"test",entityType:"test",entityId:"b",payload:{},occurredAt:new Date()}];
 expect((await new MemoryLearningStateExportRepository(store).get("a")).routine).toHaveLength(1);expect((await new MemoryExportRepository(store).getSnapshot("a")).events.map(e=>e.id)).toEqual(["a"]);
});
