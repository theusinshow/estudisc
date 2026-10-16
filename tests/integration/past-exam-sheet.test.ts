import { expect,it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { AssessmentRepository } from "@/db/repositories/assessment-repository";
import { attempts,conceptEvidence,studyEvents } from "@/db/schema";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
import { sheetTemplateInput } from "../unit/past-exam-fixture";
async function setup(){const database=await createMigratedPgliteTestDatabase();expect((await importTrackPack(JSON.parse(JSON.stringify(source)),new DrizzleTrackImportRepository(database.db))).status).toBe("imported");return database;}
it("runs a past-exam answer sheet without leaking keys or emitting learning evidence",async()=>{
  const database=await setup();try{
    const repo=new AssessmentRepository(database.db);const template=await repo.importTemplate(sheetTemplateInput());
    expect(await repo.importTemplate(sheetTemplateInput())).toMatchObject({id:template.id});
    await expect(repo.importTemplate(sheetTemplateInput({title:"Outro título"}))).rejects.toThrow("conflict");
    const now=new Date("2026-10-16T12:00:00Z");const started=await repo.start("student-a",template.id,crypto.randomUUID(),now);
    expect(await repo.view("student-a",started.id)).toBeNull();expect(await repo.sheetView("student-b",started.id)).toBeNull();
    const view=(await repo.sheetView("student-a",started.id))!;expect(view.items).toHaveLength(28);expect(JSON.stringify(view)).not.toMatch(/"key"|answerKeyUrl/);
    await repo.saveSheet("student-a",started.id,1,"B",false,now);await repo.saveSheet("student-a",started.id,1,"A",true,now);await repo.saveSheet("student-a",started.id,8,"C",false,now);await repo.saveSheet("student-a",started.id,15,"A",false,now);
    await expect(repo.saveSheet("student-a",started.id,29,"A",false,now)).rejects.toThrow("unavailable");
    await expect(repo.saveSheet("student-b",started.id,2,"A",false,now)).rejects.toThrow("unavailable");
    expect((await repo.sheetView("student-a",started.id))!.responses).toContainEqual({position:1,answer:"A",flagged:true});
    const result=await repo.finalize("student-a",started.id,now);
    expect(result).toMatchObject({kind:"PAST_EXAM_SHEET",correct:2,scored:27,annulled:1,blank:25});expect(await repo.finalize("student-a",started.id,now)).toEqual(result);
    expect(await database.db.select().from(attempts)).toHaveLength(0);expect(await database.db.select().from(conceptEvidence)).toHaveLength(0);
    expect((await database.db.select().from(studyEvents)).filter(event=>event.type==="assessment_finalized")).toHaveLength(1);
    const done=(await repo.sheetView("student-a",started.id))!;expect(done.links).toHaveProperty("answerKeyUrl");expect(done.result?.byPosition[14].outcome).toBe("annulled");
    await expect(repo.saveSheet("student-a",started.id,2,"A",false,now)).rejects.toThrow("unavailable");
    expect(await repo.listSheetInstances("student-a")).toHaveLength(1);expect((await repo.list("student-a"))[0]).toMatchObject({kind:"PAST_EXAM_SHEET",templateId:template.id});
  }finally{await database.close();}
});
it("refuses a reserved answer sheet before its release date",async()=>{
  const database=await setup();try{
    const repo=new AssessmentRepository(database.db);const base=sheetTemplateInput();
    const template=await repo.importTemplate({...base,id:"past-exam-test-2026-1",title:"Prova 2026.1",availableAt:"2026-11-09T03:00:00.000Z",exam:{...base.exam,examId:"ifsc-integrado-2026-1",edition:"2026.1",year:2026}});
    await expect(repo.start("student-a",template.id,crypto.randomUUID(),new Date("2026-10-16T12:00:00Z"))).rejects.toThrow("unavailable");
    expect(await repo.start("student-a",template.id,crypto.randomUUID(),new Date("2026-11-10T12:00:00Z"))).toHaveProperty("id");
  }finally{await database.close();}
});
