import type { AssessmentSnapshot } from "./contracts";
import { evaluateQuestion } from "@/features/questions/evaluation";
export function scoreAssessment(snapshot:AssessmentSnapshot,responses:ReadonlyMap<string,unknown>){
  const items=snapshot.questions.map(item=>({versionId:item.versionId,question:item.question,response:responses.get(item.versionId)??null,evaluation:evaluateQuestion(item.question,responses.get(item.versionId)??null)}));
  const bySubject:Record<string,{correct:number;scored:number;total:number;annulled:number}>={};
  for(const item of items){const subject=bySubject[item.question.subjectCode]??={correct:0,scored:0,total:0,annulled:0};subject.total++;if(item.evaluation.evidenceEligible){subject.scored++;if(item.evaluation.correct)subject.correct++;}else subject.annulled++;}
  return {items,correct:items.filter(item=>item.evaluation.correct).length,scored:items.filter(item=>item.evaluation.evidenceEligible).length,total:items.length,bySubject};
}
