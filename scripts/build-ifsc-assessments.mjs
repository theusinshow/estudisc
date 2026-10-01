import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
const root=new URL("../",import.meta.url),read=path=>JSON.parse(readFileSync(new URL(path,root),"utf8"));
const settings=read("packs/seeds/ifsc-2027.exam-settings.json"),golden=read("packs/seeds/ifsc-2027.golden.track.v2.json");
const ref=q=>({id:q.id,version:q.version}),templates=[];
const add=(id,title,kind,items,durationMinutes,extra={})=>templates.push({id,version:1,title,kind,trackId:settings.trackId,durationMinutes,items,shuffleChoices:false,status:"draft",...extra});
for(const edition of ["2025.1","2025.2","2026.1","2026.2"])add(`ifsc-official-${edition}`,`IFSC Integrado ${edition}`,"OFFICIAL_EXAM",Array.from({length:28},(_,i)=>({id:`IFSC-INT-${edition}-Q${String(i+1).padStart(2,"0")}`,version:1})),settings.durationMinutes,{examId:`IFSC-INT-${edition}`,...(settings.benchmarks[edition]?{availableAt:new Date(settings.benchmarks[edition]).toISOString()}: {})});
add("ifsc-mini-golden","Prática curta de porcentagem","MINI_SIMULATION",golden.questions.filter(q=>q.id.startsWith("Q-MAT-GOLDEN")).slice(0,4).map(ref),15);
for(const subject of ["MAT","POR","CIE","GH"])add(`ifsc-subject-${subject.toLowerCase()}`,`Prática de ${subject}`,"SUBJECT_SIMULATION",golden.questions.filter(q=>q.subjectCode===subject&&!q.id.includes("PREREQ")).map(ref),30);
add("ifsc-targeted-percentage","Diagnóstico direcionado: porcentagem","TARGETED_DIAGNOSTIC",golden.questions.filter(q=>q.id.startsWith("Q-MAT-GOLDEN")).slice(0,4).map(ref),15);
// A full simulation and broad diagnostic use unreserved 2025.2, not a protected benchmark.
const unreserved=templates.find(t=>t.id==="ifsc-official-2025.2").items;
add("ifsc-full-training","Simulado completo de treino","FULL_SIMULATION",unreserved,settings.durationMinutes);
add("ifsc-broad-diagnostic","Diagnóstico inicial das quatro áreas","BROAD_DIAGNOSTIC",unreserved,90);
mkdirSync(new URL(".local/ifsc-official/",root),{recursive:true});writeFileSync(new URL(".local/ifsc-official/assessment-templates.draft.json",root),JSON.stringify(templates,null,2)+"\n");
console.log(`${templates.length} draft templates; publication requires QA-approved Question versions. Benchmark dates come from settings.`);
