import { expect,it } from "vitest";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { MemoryAssessmentRepository } from "@/db/repositories/memory-assessment-repository";
import { sheetTemplateInput } from "./past-exam-fixture";
it("mirrors the answer-sheet lifecycle in memory",async()=>{
  const store=structuredClone(getMemoryStore());const repo=new MemoryAssessmentRepository(store);const attemptsBefore=store.attempts.length,evidenceBefore=store.conceptEvidence.length;
  const template=await repo.importTemplate(sheetTemplateInput());const now=new Date("2026-10-16T12:00:00Z");
  const started=await repo.start("student-a",template.id,crypto.randomUUID(),now);
  expect(await repo.view("student-a",started.id)).toBeNull();expect(await repo.sheetView("student-b",started.id)).toBeNull();
  expect(JSON.stringify(await repo.sheetView("student-a",started.id))).not.toMatch(/"key"|answerKeyUrl/);
  await repo.saveSheet("student-a",started.id,1,"A",false,now);await repo.saveSheet("student-a",started.id,8,"C",true,now);
  await expect(repo.saveSheet("student-a",started.id,29,"A",false,now)).rejects.toThrow("unavailable");
  const result=await repo.finalize("student-a",started.id,now);expect(result).toMatchObject({kind:"PAST_EXAM_SHEET",correct:2,scored:27,blank:25});
  expect(store.attempts).toHaveLength(attemptsBefore);expect(store.conceptEvidence).toHaveLength(evidenceBefore);
  expect((await repo.list("student-a"))[0]).toMatchObject({kind:"PAST_EXAM_SHEET",templateId:template.id});expect(await repo.listSheetInstances("student-a")).toHaveLength(1);
  expect((await repo.sheetView("student-a",started.id))!.links.answerKeyUrl).toContain("www.ifsc.edu.br");
});
it("refuses a reserved sheet in memory before availableAt",async()=>{
  const repo=new MemoryAssessmentRepository(structuredClone(getMemoryStore()));const template=await repo.importTemplate(sheetTemplateInput({id:"past-exam-reserved",availableAt:"2026-11-09T03:00:00.000Z"}));
  await expect(repo.start("student-a",template.id,crypto.randomUUID(),new Date("2026-10-16T12:00:00Z"))).rejects.toThrow("unavailable");
});
