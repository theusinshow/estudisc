import { existsSync,readFileSync } from "node:fs";
import { expect,it } from "vitest";
import { questionSchema } from "@/features/questions/contracts";
import { validatePng } from "@/db/repositories/question-asset-repository";
const file=".local/ifsc-official/bank.draft.json";
it.skipIf(!existsSync(file))("preserves all 112 official identities, definitive keys and private PNG references",()=>{
  const bank=JSON.parse(readFileSync(file,"utf8"));
  const questions=bank.questions.map((q:unknown)=>questionSchema.parse(q));expect(questions).toHaveLength(112);
  expect(questions.filter((q:{status:string})=>q.status==="annulled")).toHaveLength(1);
  expect(questions.filter((q:{exposurePolicy:{reservedForAssessment:boolean}})=>q.exposurePolicy.reservedForAssessment)).toHaveLength(56);
  for(const asset of bank.assets){const dimensions=validatePng(readFileSync(`.local/ifsc-official/${asset.file}`));expect(dimensions.contentHash).toBe(asset.sha256);}
});
