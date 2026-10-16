import { pastExamSheetTemplateSchema,PAST_EXAM_SHEET,sheetResultSchema,type PastExamSheetTemplate } from "./sheet-contracts";
type TemplateRow={id:string;stableId:string;version:number;kind:string;definition:unknown};
type SheetInstanceRow={id:string;templateId:string;status:string;startedAt:Date;deadlineAt:Date;result:unknown};
export type PastExamCard={templateId:string;title:string;edition:string;year:number;variant:string;appliedOn:string;itemCount:number;annulledCount:number;subjects:string[];durationMinutes:number;catalogVerifiedAt:string;state:"FREE"|"ACTIVE"|"DONE"|"RESERVED";attempts:number;availableAt?:string;examUrl?:string;answerKeyUrl?:string;activeInstanceId?:string;deadlineAt?:string;best?:{correct:number;scored:number}};
function sheets(templates:readonly TemplateRow[]){return templates.filter(row=>row.kind===PAST_EXAM_SHEET).map(row=>({row,template:pastExamSheetTemplateSchema.parse(row.definition)}));}
const results=(rows:readonly SheetInstanceRow[])=>rows.filter(row=>row.status==="FINALIZED").flatMap(row=>{const parsed=sheetResultSchema.safeParse(row.result);return parsed.success?[{row,result:parsed.data}]:[];});
/** Student DTO for /past-exams. It never contains answer keys; reserved editions carry no official links. */
export function buildPastExamCards(templates:readonly TemplateRow[],instances:readonly SheetInstanceRow[],now:Date):PastExamCard[]{
  const all=sheets(templates);const stableOf=new Map(all.map(({row})=>[row.id,row.stableId]));const latest=new Map<string,{row:TemplateRow;template:PastExamSheetTemplate}>();
  for(const entry of all){const current=latest.get(entry.row.stableId);if(!current||current.row.version<entry.row.version)latest.set(entry.row.stableId,entry);}
  return [...latest.values()].map(({row,template}):PastExamCard=>{
    const own=instances.filter(instance=>stableOf.get(instance.templateId)===row.stableId);const active=own.find(instance=>instance.status==="ACTIVE");const done=results(own).map(entry=>entry.result);
    const reserved=!!template.availableAt&&now.getTime()<Date.parse(template.availableAt);
    const best=done.reduce<{correct:number;scored:number}|undefined>((top,result)=>!top||result.correct/Math.max(result.scored,1)>top.correct/Math.max(top.scored,1)?{correct:result.correct,scored:result.scored}:top,undefined);
    return {templateId:row.id,title:template.title,edition:template.exam.edition,year:template.exam.year,variant:template.exam.variant,appliedOn:template.exam.appliedOn,itemCount:template.items.length,annulledCount:template.items.filter(item=>item.key==="ANNULLED").length,subjects:(template.subjects??[]).map(subject=>subject.name),durationMinutes:template.durationMinutes,catalogVerifiedAt:template.provenance.catalogVerifiedAt,
      state:reserved?"RESERVED":active?"ACTIVE":done.length?"DONE":"FREE",attempts:done.length,
      ...(template.availableAt?{availableAt:template.availableAt}:{}),...(reserved?{}:{examUrl:template.links.examUrl}),...(!reserved&&done.length?{answerKeyUrl:template.links.answerKeyUrl}:{}),
      ...(active?{activeInstanceId:active.id,deadlineAt:active.deadlineAt.toISOString()}:{}),...(best?{best}:{})};
  }).sort((a,b)=>b.edition.localeCompare(a.edition)||a.variant.localeCompare(b.variant));
}
export function buildPastExamProgress(templates:readonly TemplateRow[],instances:readonly SheetInstanceRow[]){
  const titles=new Map(sheets(templates).map(({row,template})=>[row.id,template.title]));
  return results(instances).flatMap(({row,result})=>{const title=titles.get(row.templateId);return title?[{instanceId:row.id,title,correct:result.correct,scored:result.scored,startedAt:row.startedAt.toISOString()}]:[];}).sort((a,b)=>a.startedAt.localeCompare(b.startedAt));
}
