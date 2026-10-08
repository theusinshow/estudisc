import {spawnSync} from "node:child_process";
import {createRequire} from "node:module";
import {mkdirSync,writeFileSync} from "node:fs";
const cli=createRequire(import.meta.url).resolve("@playwright/test/cli");
const suites=["foundation-evolution","routine-planner","lesson-resume","adaptive-session","interactive-blocks","review-mistake-loop","ai-learning","knowledge-map","exam-navigation","admin-authoring","learning-catalog","admin-metadata","source-goal-prediction"];
const requested=process.argv.slice(2),selected=requested.length?requested:suites;
if(selected.some(name=>!suites.includes(name)))throw new Error("Unknown rollout suite");
const flags=Object.fromEntries(["NEW_TODAY","STUDY_PLANNER","ADAPTIVE_SESSION","INTERACTIVE_LESSONS","AI_LEARNING","KNOWLEDGE_MAP","SMART_MISTAKES","REAL_EXAM","CONTENT_HEALTH"].map(name=>[`FEATURE_${name}`,"true"]));
mkdirSync(".local/evolution-final",{recursive:true});let failed=false;
// Each suite/project owns its Next process: routine changes and imported draft versions
// cannot contaminate another feature's canonical fixture in the process-global memory harness.
for(const suite of selected)for(const project of ["chromium","mobile-chrome"]){
 const result=spawnSync(process.execPath,[cli,"test",`tests/e2e/${suite}.spec.ts`,`--project=${project}`,`--output=test-results/evolution-rollout/${project}-${suite}`],{env:{...process.env,...flags},encoding:"utf8",maxBuffer:8*1024*1024});
 const log=`${result.stdout??""}\n${result.stderr??""}`;writeFileSync(`.local/evolution-final/${project}-${suite}.log`,log);
 console.log(`${project}/${suite}: ${result.status===0?"PASS":"FAIL"} ${log.split(/\r?\n/).filter(line=>/\d+ (passed|skipped|failed)/.test(line)).map(line=>line.trim()).join("; ")}`);
 if(result.error||result.signal)console.error(result.error?.message??result.signal);
 if(result.status!==0)failed=true;
}
process.exitCode=failed?1:0;
