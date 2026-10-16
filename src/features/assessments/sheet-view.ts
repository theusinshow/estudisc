import { PAST_EXAM_SHEET,sheetResultSchema,type PastExamSheetTemplate,type SheetAnswer,type SheetSnapshot } from "./sheet-contracts";
type ViewInput={instance:{id:string;status:string;startedAt:Date;deadlineAt:Date;result:unknown};snapshot:SheetSnapshot;template:PastExamSheetTemplate;responses:readonly {position:number;answer:SheetAnswer;flagged:boolean}[]};
type SheetLinks={examUrl:string;answerKeyUrl?:string};
/** Student DTO for an answer sheet. It carries no `key`; the answer-key link and per-position keys appear only once FINALIZED. */
export function toSheetView({instance,snapshot,template,responses}:ViewInput,serverNow=Date.now()){
  const finalized=instance.status==="FINALIZED";const links:SheetLinks=finalized?{examUrl:template.links.examUrl,answerKeyUrl:template.links.answerKeyUrl}:{examUrl:template.links.examUrl};
  return {serverNow,id:instance.id,status:instance.status,kind:PAST_EXAM_SHEET,mode:"EXAM" as const,startedAt:instance.startedAt.toISOString(),deadlineAt:instance.deadlineAt.toISOString(),title:template.title,exam:snapshot.exam,items:snapshot.items,subjects:snapshot.subjects??[],links,provenance:{catalogVerifiedAt:template.provenance.catalogVerifiedAt,transcriptionNote:template.provenance.transcriptionNote},responses:responses.map(row=>({position:row.position,answer:row.answer,flagged:row.flagged})),result:finalized?sheetResultSchema.parse(instance.result):null};
}
export type SheetView=ReturnType<typeof toSheetView>;
