import type { AssessmentSnapshot } from "./contracts";
import { evaluateQuestion } from "@/features/questions/evaluation";
export function assessmentFeedback(question:AssessmentSnapshot["questions"][number]["question"],outcome:string){
  const answer=question.answer;
  const correctAnswer=outcome==="annulled"?"Questão anulada":answer.kind==="multiple_choice"?`${answer.choiceId} · ${question.choices?.find(choice=>choice.id===answer.choiceId)?.content??""}`:answer.kind==="numeric"?`${answer.value.toLocaleString("pt-BR")}${answer.unit?` ${answer.unit}`:""}`:JSON.stringify(answer);
  return {stem:question.stem,correctAnswer};
}
export function diagnosticSignals(items:readonly {question:AssessmentSnapshot["questions"][number]["question"];evaluation:{correct:boolean;evidenceEligible:boolean}}[]){
  const byConcept=new Map<string,{observed:number;correct:number}>();
  for(const item of items){if(!item.evaluation.evidenceEligible)continue;for(const id of item.question.conceptIds){const count=byConcept.get(id)??{observed:0,correct:0};count.observed++;if(item.evaluation.correct)count.correct++;byConcept.set(id,count);}}
  return [...byConcept].map(([conceptId,count])=>({conceptId,...count,needsTargetedCheck:count.observed<2||count.correct<count.observed,confidence:count.observed<3?"limited":"observed_sample",reason:count.correct<count.observed?"Retomar o conceito e conferir com uma questão diferente.":"Confirmar com recuperação posterior; esta amostra não prova domínio."}));
}
export function scoreAssessment(snapshot:AssessmentSnapshot,responses:ReadonlyMap<string,unknown>){
  const items=snapshot.questions.map(item=>({versionId:item.versionId,question:item.question,response:responses.get(item.versionId)??null,evaluation:evaluateQuestion(item.question,responses.get(item.versionId)??null)}));
  const bySubject:Record<string,{correct:number;scored:number;total:number;annulled:number}>={};
  for(const item of items){const subject=bySubject[item.question.subjectCode]??={correct:0,scored:0,total:0,annulled:0};subject.total++;if(item.evaluation.evidenceEligible){subject.scored++;if(item.evaluation.correct)subject.correct++;}else subject.annulled++;}
  return {items,correct:items.filter(item=>item.evaluation.correct).length,scored:items.filter(item=>item.evaluation.evidenceEligible).length,total:items.length,bySubject};
}
