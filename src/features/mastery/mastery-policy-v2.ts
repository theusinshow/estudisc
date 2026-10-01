import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";
import { calculateConceptMastery,masteryStateLabels,type MasteryState } from "./mastery-policy";
export const MASTERY_V2="mastery.v2";
export const masteryV2Configuration={difficulty:{foundation:0.7,direct:0.85,applied:1,ifsc:1.15,challenge:1.2},mode:{learn:0.6,practice:0.85,review:1,assessment:1.1},hints:[1,0.8,0.6,0.4],solution:0.15,thresholds:{practicing:1.2,strong:2.8,mastered:4.5}} as const;
export type EvidenceV2Input={correct:boolean;difficulty:keyof typeof masteryV2Configuration.difficulty;mode:keyof typeof masteryV2Configuration.mode;hintLevel:number;solutionRevealed:boolean;questionId:string;delayedRetrieval:boolean;transfer:boolean;createdAt:Date};
export function evidenceStrengthV2(input:EvidenceV2Input){return input.correct?Math.round(100*masteryV2Configuration.difficulty[input.difficulty]*masteryV2Configuration.mode[input.mode]*(input.solutionRevealed?masteryV2Configuration.solution:masteryV2Configuration.hints[Math.max(0,Math.min(3,input.hintLevel))])):0;}
type Evidence=Pick<ConceptEvidenceRecord,"conditions"|"createdAt"|"type"|"strength">;
export function calculateConceptMasteryV2(evidence:readonly Evidence[],now:Date){
  const facts=evidence.filter(item=>item.conditions.policyVersion===MASTERY_V2);
  const successes=facts.filter(item=>item.conditions.outcome==="passed");
  const independent=successes.filter(item=>item.conditions.hintLevel===0&&item.conditions.solutionRevealed===false);
  const distinct=new Map<string,Evidence>();
  for(const item of independent){const key=`${String(item.conditions.questionId)}:${item.createdAt.toISOString().slice(0,10)}`;const old=distinct.get(key);if(!old||old.strength<item.strength)distinct.set(key,item);}
  const useful=[...distinct.values()];const strength=useful.reduce((sum,item)=>sum+item.strength/100,0);
  const days=new Set(useful.map(item=>item.createdAt.toISOString().slice(0,10)));const questions=new Set(useful.map(item=>item.conditions.questionId));
  const delayed=useful.some(item=>item.conditions.delayedRetrieval===true);const transfer=useful.some(item=>item.conditions.transfer===true&&["applied","ifsc","challenge"].includes(String(item.conditions.difficulty)));
  let state:MasteryState=facts.length?"introduced":"unseen";
  if(useful.length||successes.some(item=>item.strength>=30))state="understood";
  if(useful.length>=2&&strength>=masteryV2Configuration.thresholds.practicing)state="practicing";
  if(useful.length>=4&&days.size>=2&&questions.size>=2&&delayed&&strength>=masteryV2Configuration.thresholds.strong)state="strong";
  if(useful.length>=6&&days.size>=3&&questions.size>=3&&delayed&&transfer&&strength>=masteryV2Configuration.thresholds.mastered)state="mastered";
  const latest=[...useful].sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime())[0];
  const age=latest?Math.max(0,(now.getTime()-latest.createdAt.getTime())/86400000):Infinity;
  const retention=latest?Math.exp(-age/(delayed?14:3)):0;
  const confidence=Math.min(1,questions.size/4)*Math.min(1,days.size/3);
  const latestFailure=facts.filter(item=>item.conditions.outcome==="failed").some(item=>!latest||item.createdAt>latest.createdAt);
  return {state,level:["unseen","introduced","understood","practicing","strong","mastered"].indexOf(state),label:masteryStateLabels[state],policyVersion:MASTERY_V2,evidenceCount:facts.length,totalStrength:strength,retention,confidence,reviewDue:retention<0.6||latestFailure,reasons:[`${useful.length} evidências independentes em ${days.size} dias e ${questions.size} questões.`,state==="mastered"?"Há recuperação posterior e aplicação em contexto diferente.":"Mais prática independente e recuperação posterior podem fortalecer o domínio."]};
}
export function calculateVersionedMastery(evidence:readonly ConceptEvidenceRecord[],now=new Date()){
  return evidence.some(item=>item.conditions.policyVersion===MASTERY_V2)?calculateConceptMasteryV2(evidence,now):calculateConceptMastery(evidence);
}
