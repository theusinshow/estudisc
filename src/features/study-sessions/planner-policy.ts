export const PLANNER_POLICY="planner.v1";
export type PlannerPhase="FOUNDATION"|"BUILD"|"CONSOLIDATE"|"EXAM_PREP";
export type PlannerCandidate={id:string;subjectCode:string;kind:"review"|"remediation"|"learn"|"practice";minutes:number;importance:number;weakness:number;dueDays:number;requiredPrerequisitesReady:boolean;plannerReady:boolean;reserved:boolean};
export function examPhase(now:Date,examDate:Date):PlannerPhase{const days=(examDate.getTime()-now.getTime())/86400000;return days<=14?"EXAM_PREP":days<=30?"CONSOLIDATE":days<=60?"BUILD":"FOUNDATION";}
export function candidatePriority(candidate:PlannerCandidate,phase:PlannerPhase,subjectMinutes:Readonly<Record<string,number>>){
  const total=Object.values(subjectMinutes).reduce((sum,value)=>sum+value,0);
  const studied=Object.hasOwn(subjectMinutes,candidate.subjectCode)?subjectMinutes[candidate.subjectCode]:0;
  const imbalance=total?Math.max(-20,Math.min(20,(0.25-studied/total)*80)):0;
  const phaseBonus=candidate.kind==="review"||candidate.kind==="practice"?(phase==="EXAM_PREP"?20:phase==="CONSOLIDATE"?10:0):0;
  return Math.min(60,Math.max(0,candidate.dueDays)*8)+(candidate.kind==="remediation"?30:0)+candidate.weakness*25+candidate.importance*10+imbalance+phaseBonus;
}
export function planCandidates(candidates:readonly PlannerCandidate[],budgetMinutes:number,phase:PlannerPhase,subjectMinutes:Readonly<Record<string,number>>,subjectLimits?:Readonly<Record<string,number>>){
  let remaining=budgetMinutes;let newCount=0;const history:Record<string,number>=Object.assign(Object.create(null),subjectMinutes);const selected:PlannerCandidate[]=[];
  const eligible=candidates.filter(candidate=>candidate.plannerReady&&!candidate.reserved&&(candidate.requiredPrerequisitesReady||candidate.kind==="review"||candidate.kind==="remediation"));
  const used=new Set<string>();
  const allocated:Record<string,number>=Object.create(null);
  while(remaining>0){
    const next=eligible.filter(candidate=>!used.has(candidate.id)&&candidate.minutes<=remaining&&(!subjectLimits||candidate.minutes+(allocated[candidate.subjectCode]??0)<=(subjectLimits[candidate.subjectCode]??0))&&(candidate.kind!=="learn"||newCount<(phase==="EXAM_PREP"?0:2))).sort((a,b)=>candidatePriority(b,phase,history)-candidatePriority(a,phase,history)||a.id.localeCompare(b.id))[0];
    if(!next)break;selected.push(next);used.add(next.id);remaining-=next.minutes;if(next.kind==="learn")newCount++;history[next.subjectCode]=(history[next.subjectCode]??0)+next.minutes;allocated[next.subjectCode]=(allocated[next.subjectCode]??0)+next.minutes;
  }
  return {policyVersion:subjectLimits?`${PLANNER_POLICY}+routine.v1`:PLANNER_POLICY,phase,items:selected,usedMinutes:budgetMinutes-remaining,contentGaps:candidates.filter(candidate=>!candidate.plannerReady||!candidate.requiredPrerequisitesReady).map(candidate=>candidate.id).sort()};
}
