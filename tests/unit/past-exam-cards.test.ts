import { expect,it } from "vitest";
import { pastExamSheetTemplateSchema } from "@/features/assessments/sheet-contracts";
import { scoreSheet } from "@/features/assessments/sheet-scoring";
import { buildPastExamCards,buildPastExamProgress } from "@/features/assessments/past-exam-cards";
import { sheetTemplateInput } from "./past-exam-fixture";
const free=pastExamSheetTemplateSchema.parse(sheetTemplateInput());
const reserved=pastExamSheetTemplateSchema.parse(sheetTemplateInput({id:"past-exam-test-2026-1",title:"Prova 2026.1",availableAt:"2026-11-09T03:00:00.000Z",exam:{...free.exam,examId:"ifsc-integrado-2026-1",edition:"2026.1",year:2026}}));
const row=(definition:typeof free,id:string)=>({id,stableId:definition.id,version:definition.version,kind:"PAST_EXAM_SHEET",definition});
const now=new Date("2026-10-16T12:00:00Z");
it("hides links of reserved editions and the answer key until a finalized attempt",()=>{
  const cards=buildPastExamCards([row(free,"t1"),row(reserved,"t2"),{id:"q1",stableId:"mini",version:1,kind:"MINI_SIMULATION",definition:{}}],[],now);
  expect(cards.map(card=>card.edition)).toEqual(["2026.1","2025.1"]);
  expect(cards[0]).toMatchObject({state:"RESERVED",availableAt:"2026-11-09T03:00:00.000Z"});expect(cards[0]).not.toHaveProperty("examUrl");expect(cards[0]).not.toHaveProperty("answerKeyUrl");
  expect(cards[1]).toMatchObject({state:"FREE",examUrl:free.links.examUrl,annulledCount:1,itemCount:28,catalogVerifiedAt:"2026-10-16"});expect(cards[1]).not.toHaveProperty("answerKeyUrl");
  expect(JSON.stringify(cards)).not.toContain("\"key\"");
});
it("follows attempts across template versions and reports progress",()=>{
  const v2=pastExamSheetTemplateSchema.parse({...sheetTemplateInput(),version:2});const result=scoreSheet(free,new Map([[1,"A"]]));
  const instances=[{id:"i1",templateId:"t1",status:"FINALIZED",startedAt:now,deadlineAt:now,result},{id:"i2",templateId:"t1v2",status:"ACTIVE",startedAt:now,deadlineAt:now,result:null}];
  const cards=buildPastExamCards([row(free,"t1"),row(v2,"t1v2")],instances,now);
  expect(cards).toHaveLength(1);expect(cards[0]).toMatchObject({templateId:"t1v2",state:"ACTIVE",activeInstanceId:"i2",attempts:1,best:{correct:1,scored:27},answerKeyUrl:free.links.answerKeyUrl});
  expect(buildPastExamProgress([row(free,"t1"),row(v2,"t1v2")],instances)).toEqual([{instanceId:"i1",title:"Prova 2025.1",correct:1,scored:27,startedAt:now.toISOString()}]);
});
