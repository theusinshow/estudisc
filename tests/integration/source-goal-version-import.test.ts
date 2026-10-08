// @vitest-environment node
import {expect,it} from "vitest";
import {sourceGoalFixture} from "../fixtures/source-goal-enrichment";
import {createEnrichmentPreview} from "../../tools/estudisc-content-studio/enrichment";
import {DrizzleTrackImportRepository} from "@/db/repositories/track-import-repository";
import {ContentQaRepository} from "@/db/repositories/content-qa-repository";
import {CatalogRepository} from "@/db/repositories/catalog-repository";
import {importLessonVersion} from "@/features/import/application/lesson-version-policy";
import {hashCanonicalJson} from "@/lib/canonical-json";
import {questionVersions,attempts,conceptEvidence} from "@/db/schema";
import {createMigratedPgliteTestDatabase} from "./pglite-test-db";
it("appends and directly releases a source-derived prediction through the existing SQL engine while retaining Questions/original goals/history",async()=>{
 const fixture=await createMigratedPgliteTestDatabase();try{
  const {pack,source,moduleRecord,recipe,blueprint}=sourceGoalFixture(),db=fixture.db,repo=new DrizzleTrackImportRepository(db as never,"fixture-source-admin"),qa=new ContentQaRepository(db as never);
  await repo.applyTrackPack(pack,hashCanonicalJson(pack));await qa.publishLessonsDirect({ownerId:"fixture-source-admin",role:"ADMIN"},{lessons:[{lessonId:source.id,version:source.version}],reason:"Disposable source-goal fixture using actual Admin Direct; no independent approval."});
  const originalQuestions=await db.select().from(questionVersions),preview=createEnrichmentPreview(pack,blueprint,recipe);
  const packet={schema:"caderno.lesson.v2",packId:"fixture.source-goal.sql",version:1,authorId:recipe.authorId,target:{trackId:pack.track.id,trackVersion:pack.version,moduleId:moduleRecord.id,lessonId:source.id,baseVersion:source.version,baseHash:recipe.sourceLessonHash},lesson:preview.lesson,questionReferences:preview.questionReferences};
  expect((await importLessonVersion(packet,repo,true)).status).toBe("ready");expect((await importLessonVersion(packet,repo)).status).toBe("imported");
  await qa.publishLessonsDirect({ownerId:"fixture-source-admin",role:"ADMIN"},{lessons:[{lessonId:source.id,version:source.version+1}],reason:"Disposable proposed-goal release under actual ADMIN authorization, not original authorship."});
  const catalog=new CatalogRepository(db as never),current=await catalog.getLesson(source.id,undefined,undefined,true),prior=await catalog.getLesson(source.id,source.version,undefined,true);
  expect(current?.blocks.some(b=>b.type==="prediction")).toBe(true);expect(prior?.blocks.some(b=>b.type==="prediction")).toBe(false);expect(await db.select().from(questionVersions)).toEqual(originalQuestions);expect(await db.select().from(attempts)).toEqual([]);expect(await db.select().from(conceptEvidence)).toEqual([]);
 }finally{await fixture.close();}
},30000);
