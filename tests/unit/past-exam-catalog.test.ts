import { existsSync,readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import catalog from "../../packs/past-exams/ifsc-integrado-2022-2026.catalog.json";
import releases from "../../packs/past-exams/releases.json";
import { catalogToSheetTemplates,crossCheckPrivateBank } from "@/features/assessments/past-exam-catalog";
const options={trackId:"ifsc-2027",status:"published" as const,reason:"Publicação autorizada das provas anteriores (teste).",availableAt:releases};
const clone=()=>JSON.parse(JSON.stringify(catalog));
const templates=catalogToSheetTemplates(catalog,"b".repeat(64),options);
describe("past exam catalog",()=>{
  it("converts the 11 Integrated editions",()=>{
    expect(templates).toHaveLength(11);expect(templates.map(template=>template.items.length).sort()).toEqual([20,20,20,20,24,24,28,28,28,28,28]);
    expect(templates.find(template=>template.exam.edition==="2025.1")!.items[14].key).toBe("ANNULLED");
    expect(templates.filter(template=>template.items.some(item=>item.key==="ANNULLED")).map(template=>template.exam.edition).sort()).toEqual(["2022.2","2023.2","2025.1"]);
    expect(templates.filter(template=>template.availableAt).map(template=>template.exam.edition).sort()).toEqual(["2026.1","2026.2"]);
    expect(new Set(templates.map(template=>template.exam.examId)).size).toBe(11);
  });
  it("rejects broken catalogs with the edition in the message",()=>{
    const badKey=clone();badKey.exams[0].answerKey["03"]="F";expect(()=>catalogToSheetTemplates(badKey,"b".repeat(64),options)).toThrow(/2022-1-florianopolis: invalid key F at 3/);
    const badAnnulled=clone();badAnnulled.exams[1].annulledQuestions=[11];expect(()=>catalogToSheetTemplates(badAnnulled,"b".repeat(64),options)).toThrow(/2022-2: annulledQuestions/);
    const badHost=clone();badHost.exams[0].examUrl="https://example.com/prova.pdf";expect(()=>catalogToSheetTemplates(badHost,"b".repeat(64),options)).toThrow(/Official IFSC host/);
    const duplicate=clone();duplicate.exams.push(duplicate.exams[0]);expect(()=>catalogToSheetTemplates(duplicate,"b".repeat(64),options)).toThrow(/duplicate edition/);
  });
  it("detects disagreement with an official bank",()=>{
    const q1=templates.find(template=>template.exam.edition==="2025.1")!.items[0].key;const wrong=q1==="A"?"B":"A";
    expect(crossCheckPrivateBank(templates,{questions:[{status:"draft",provenance:{examId:"IFSC-INT-2025.1",officialNumber:1},choices:[{id:q1,correct:true}]},{status:"annulled",provenance:{examId:"IFSC-INT-2025.1",officialNumber:15}}]})).toEqual([]);
    expect(crossCheckPrivateBank(templates,{questions:[{status:"draft",provenance:{examId:"IFSC-INT-2025.1",officialNumber:1},choices:[{id:wrong,correct:true}]}]})).toHaveLength(1);
  });
  const bankPath=".local/ifsc-official/bank.draft.json";
  it.skipIf(!existsSync(bankPath))("matches the private official bank when present",()=>{expect(crossCheckPrivateBank(templates,JSON.parse(readFileSync(bankPath,"utf8")))).toEqual([]);});
});
