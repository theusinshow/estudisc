import { expect,it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { AssessmentRepository } from "@/db/repositories/assessment-repository";
import { attempts,conceptEvidence,assessmentResponses } from "@/db/schema";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
it("freezes and resumes, permits response changes, then finalizes exactly once",async()=>{
  const database=await createMigratedPgliteTestDatabase();try{
    const fixture=JSON.parse(JSON.stringify(source));fixture.questions.forEach((question:{status:string})=>question.status="published");
    expect((await importTrackPack(fixture,new DrizzleTrackImportRepository(database.db))).status).toBe("imported");
    const repo=new AssessmentRepository(database.db);const template=await repo.importTemplate({id:"mini-test",version:1,title:"Avaliação de teste",kind:"MINI_SIMULATION",trackId:"ifsc-2027",durationMinutes:5,status:"published",items:[{id:"Q-MAT-GOLDEN-1",version:1},{id:"Q-MAT-GOLDEN-3",version:1}]});
    const key=crypto.randomUUID(),now=new Date();const started=await repo.start("student-a",template.id,key,now);expect(await repo.start("student-a",template.id,key,now)).toEqual(started);
    expect(await repo.view("student-b",started.id)).toBeNull();const view=(await repo.view("student-a",started.id))!;expect(view.result).toBeNull();expect(view.questions[0].question).not.toHaveProperty("answer");
    await repo.save("student-a",started.id,view.questions[0].versionId,"14",false,now);await repo.save("student-a",started.id,view.questions[0].versionId,"15",true,now);await repo.save("student-a",started.id,view.questions[1].versionId,"30",false,now);
    expect(await database.db.select().from(attempts)).toHaveLength(0);expect(await database.db.select().from(assessmentResponses)).toHaveLength(2);
    await expect(repo.save("student-b",started.id,view.questions[0].versionId,"15",false,now)).rejects.toThrow("unavailable");
    await expect(repo.save("student-a",started.id,view.questions[0].versionId,"15",false,new Date(now.getTime()+6*60000))).rejects.toThrow("closed");
    const result=await repo.finalize("student-a",started.id,now);expect(result).toMatchObject({correct:2,scored:2});expect(await repo.finalize("student-a",started.id,now)).toEqual(result);
    expect(await database.db.select().from(attempts)).toHaveLength(2);expect(await database.db.select().from(conceptEvidence)).toHaveLength(2);
    await expect(repo.save("student-a",started.id,view.questions[0].versionId,"0",false,now)).rejects.toThrow("closed");
  }finally{await database.close();}
});
