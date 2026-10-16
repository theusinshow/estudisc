import { describe,expect,it } from "vitest";
import { buildSheetSnapshot,pastExamSheetTemplateSchema,sheetResultSchema } from "@/features/assessments/sheet-contracts";
import { scoreSheet } from "@/features/assessments/sheet-scoring";
import { sheetTemplateInput } from "./past-exam-fixture";
const letters=["A","B","C","D","E"] as const;
describe("past exam sheet template",()=>{
  it("accepts a 28-item sheet and an omitted subject layout",()=>{
    expect(pastExamSheetTemplateSchema.parse(sheetTemplateInput()).items).toHaveLength(28);
    expect(pastExamSheetTemplateSchema.safeParse(sheetTemplateInput({subjects:undefined})).success).toBe(true);
  });
  it("rejects malformed sheets",()=>{
    const base=sheetTemplateInput();
    const issues=(input:unknown)=>{const parsed=pastExamSheetTemplateSchema.safeParse(input);return parsed.success?"":parsed.error.issues.map(issue=>issue.message).join("|");};
    expect(issues({...base,items:base.items.slice(0,25)})).toMatch("20, 24 or 28");
    expect(issues({...base,items:base.items.map(item=>item.position===3?{...item,key:"F"}:item)})).not.toBe("");
    expect(issues({...base,items:base.items.map(item=>item.position===3?{...item,position:30}:item)})).not.toBe("");
    expect(issues({...base,subjects:[{name:"A",start:1,end:10},{name:"B",start:9,end:28}]})).toMatch("Subject range");
    expect(issues({...base,links:{...base.links,examUrl:"https://example.com/prova.pdf"}})).toMatch("Official IFSC host");
  });
  it("freezes a snapshot without answer keys",()=>{
    const snapshot=buildSheetSnapshot(pastExamSheetTemplateSchema.parse(sheetTemplateInput()));
    expect(JSON.stringify(snapshot)).not.toContain("\"key\"");
    expect(snapshot.items[7]).toEqual({position:8,subject:"Matemática"});
  });
});
describe("scoreSheet",()=>{
  it("excludes annulled items, counts blanks as incorrect and is deterministic",()=>{
    const template=pastExamSheetTemplateSchema.parse(sheetTemplateInput());
    const responses=new Map<number,"A"|"B"|"C"|"D"|"E"|null>(template.items.map(item=>[item.position,letters[(item.position-1)%5]]));
    responses.set(1,"B");responses.delete(2);responses.set(15,"A");
    const result=scoreSheet(template,responses);
    expect(sheetResultSchema.parse(result)).toEqual(result);
    expect(result).toMatchObject({correct:25,scored:27,total:28,annulled:1,blank:1,finishedAfterDeadline:false});
    expect(result.bySubject[0]).toEqual({name:"Português",correct:5,scored:7,total:7,annulled:0});
    expect(result.bySubject[2]).toEqual({name:"Geografia e História",correct:6,scored:6,total:7,annulled:1});
    expect(result.byPosition[14]).toMatchObject({position:15,answer:"A",key:"ANNULLED",outcome:"annulled"});
    expect(result.byPosition[1]).toMatchObject({answer:null,outcome:"blank"});
    expect(scoreSheet(template,responses)).toEqual(result);
  });
  it("returns no subject breakdown without ranges",()=>{
    expect(scoreSheet(pastExamSheetTemplateSchema.parse(sheetTemplateInput({subjects:undefined})),new Map()).bySubject).toEqual([]);
  });
});
