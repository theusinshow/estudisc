import { PAST_EXAM_SHEET,SHEET_POLICY,subjectOf,type PastExamSheetTemplate,type SheetAnswer,type SheetResult } from "./sheet-contracts";
type Row=SheetResult["byPosition"][number];
const tally=(rows:readonly Row[])=>{const annulled=rows.filter(row=>row.outcome==="annulled").length;return {correct:rows.filter(row=>row.outcome==="correct").length,scored:rows.length-annulled,total:rows.length,annulled};};
/** Training score: annulled items leave the denominator and a blank counts as incorrect. This is not the official classification rule. */
export function scoreSheet(template:PastExamSheetTemplate,responses:ReadonlyMap<number,SheetAnswer>,finishedAfterDeadline=false):SheetResult{
  const byPosition:Row[]=template.items.map(item=>{const answer=responses.get(item.position)??null;const subject=subjectOf(template.subjects,item.position);const outcome=item.key==="ANNULLED"?"annulled":answer===null?"blank":answer===item.key?"correct":"incorrect";return {position:item.position,...(subject?{subject}:{}),answer,key:item.key,outcome};});
  return {kind:PAST_EXAM_SHEET,policyVersion:SHEET_POLICY,...tally(byPosition),blank:byPosition.filter(row=>row.outcome==="blank").length,finishedAfterDeadline,bySubject:(template.subjects??[]).map(subject=>({name:subject.name,...tally(byPosition.filter(row=>row.subject===subject.name))})),byPosition};
}
