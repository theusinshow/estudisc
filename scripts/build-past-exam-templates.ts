import { existsSync,mkdirSync,readFileSync,writeFileSync } from "node:fs";
import { catalogToSheetTemplates,crossCheckPrivateBank } from "@/features/assessments/past-exam-catalog";
import { hashCanonicalJson } from "@/lib/canonical-json";
// Usage: pnpm tsx scripts/build-past-exam-templates.ts "<actual publication authorization/reason>"
const reason=process.argv[2];if(!reason||reason.length<10)throw new Error("Pass the actual publication authorization/reason (>= 10 chars).");
const catalog=JSON.parse(readFileSync("packs/past-exams/ifsc-integrado-2022-2026.catalog.json","utf8"));
const releases=JSON.parse(readFileSync("packs/past-exams/releases.json","utf8"));
const templates=catalogToSheetTemplates(catalog,hashCanonicalJson(catalog),{trackId:"ifsc-2027",status:"published",reason,availableAt:releases});
const bankPath=".local/ifsc-official/bank.draft.json";
if(existsSync(bankPath)){const mismatches=crossCheckPrivateBank(templates,JSON.parse(readFileSync(bankPath,"utf8")));if(mismatches.length){console.error(mismatches.slice(0,20).join("\n"));process.exit(1);}console.log("Private bank cross-check: PASS");}
else console.log("Private bank cross-check: SKIPPED (bank absent)");
mkdirSync(".local/past-exams",{recursive:true});writeFileSync(".local/past-exams/templates.json",JSON.stringify(templates,null,2)+"\n");
console.log(`Wrote ${templates.length} templates to .local/past-exams/templates.json (reserved: ${templates.filter(template=>template.availableAt).map(template=>template.exam.edition).join(", ")})`);
