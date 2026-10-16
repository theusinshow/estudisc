import { z } from "zod";
import { pastExamSheetTemplateSchema,PAST_EXAM_SHEET,type PastExamSheetTemplate } from "./sheet-contracts";
export class PastExamCatalogError extends Error {}
export const TRANSCRIPTION_NOTE="Gabarito transcrito do gabarito definitivo publicado pelo IFSC. Em caso de conflito, vale o documento oficial.";
const catalogExamSchema=z.object({id:z.string().regex(/^\d{4}-[12](-[a-z]+)?$/),edition:z.string(),year:z.number().int(),variant:z.string().min(1),date:z.iso.date(),questions:z.number().int(),durationMinutes:z.number().int(),subjects:z.array(z.object({name:z.string(),start:z.number().int(),end:z.number().int()})).optional(),examUrl:z.string(),answerKeyUrl:z.string(),answerKey:z.record(z.string(),z.string()),annulledQuestions:z.array(z.number().int()),questionCountScorable:z.number().int(),examType:z.string().min(1),publisher:z.string().min(1),originalSourcePage:z.string()});
export const pastExamCatalogSchema=z.object({dataset:z.string().min(1),lastVerifiedAt:z.iso.date(),exams:z.array(catalogExamSchema).min(1)});
export type CatalogConversionOptions={trackId:string;status:"draft"|"published";reason:string;availableAt:Readonly<Record<string,string>>};
function fail(id:string,message:string):never{throw new PastExamCatalogError(`${id}: ${message}`);}
/** Converts the committed IFSC catalog into answer-sheet templates (ADR 0066). Any inconsistency stops the whole conversion. */
export function catalogToSheetTemplates(input:unknown,catalogSha256:string,options:CatalogConversionOptions):PastExamSheetTemplate[]{
  const catalog=pastExamCatalogSchema.parse(input);const seen=new Set<string>();
  return catalog.exams.map(exam=>{
    if(seen.has(exam.id))fail(exam.id,"duplicate edition");seen.add(exam.id);
    // Catalog keys are zero-padded ("01"); normalize to positions and refuse ambiguous duplicates such as "3" and "03".
    const keyed=new Map<number,string>();for(const [label,value] of Object.entries(exam.answerKey)){const position=/^\d{1,2}$/.test(label)?Number(label):NaN;if(!Number.isInteger(position)||keyed.has(position))fail(exam.id,`invalid or duplicate answer-key position ${label}`);keyed.set(position,value);}
    const positions=[...keyed.keys()].sort((a,b)=>a-b);
    if(positions.length!==exam.questions||positions.some((position,index)=>position!==index+1))fail(exam.id,`answer key must cover 1..${exam.questions}`);
    const items=positions.map(position=>{const value=keyed.get(position)!;if(value==="ANULADA")return {position,key:"ANNULLED" as const};if(!/^[A-E]$/.test(value))fail(exam.id,`invalid key ${value} at ${position}`);return {position,key:value as "A"|"B"|"C"|"D"|"E"};});
    const annulled=items.filter(item=>item.key==="ANNULLED").map(item=>item.position);
    if(annulled.join()!==[...exam.annulledQuestions].sort((a,b)=>a-b).join())fail(exam.id,"annulledQuestions disagree with the answer key");
    if(exam.questionCountScorable!==exam.questions-annulled.length)fail(exam.id,"questionCountScorable disagrees with annulled items");
    const availableAt=options.availableAt[exam.id];
    const parsed=pastExamSheetTemplateSchema.safeParse({id:`past-exam-${exam.id}`,version:1,title:exam.variant==="Aplicação geral"?`Prova ${exam.edition}`:`Prova ${exam.edition} · ${exam.variant}`,kind:PAST_EXAM_SHEET,trackId:options.trackId,durationMinutes:exam.durationMinutes,...(availableAt?{availableAt}:{}),status:options.status,
      exam:{examId:`ifsc-integrado-${exam.id}`,edition:exam.edition,year:exam.year,variant:exam.variant,appliedOn:exam.date,examType:exam.examType,publisher:exam.publisher},...(exam.subjects?.length?{subjects:exam.subjects}:{}),items,
      links:{examUrl:exam.examUrl,answerKeyUrl:exam.answerKeyUrl,sourcePage:exam.originalSourcePage},
      provenance:{catalogDataset:catalog.dataset,catalogVerifiedAt:catalog.lastVerifiedAt,catalogSha256,transcriptionNote:TRANSCRIPTION_NOTE,publication:{mode:"ADMIN_DIRECT",reason:options.reason}}});
    if(!parsed.success)fail(exam.id,parsed.error.issues.map(issue=>issue.message).join("; "));
    return parsed.data;
  });
}
const bankSchema=z.object({questions:z.array(z.object({status:z.string(),provenance:z.object({examId:z.string(),officialNumber:z.number().int()}),choices:z.array(z.object({id:z.string(),correct:z.boolean()})).optional()}))});
/** Compares catalog keys with the private official bank (general application only). Returns human-readable mismatches. */
export function crossCheckPrivateBank(templates:readonly PastExamSheetTemplate[],bank:unknown){
  const mismatches:string[]=[];
  for(const question of bankSchema.parse(bank).questions){
    const edition=question.provenance.examId.replace(/^IFSC-INT-/,"");const template=templates.find(item=>item.exam.edition===edition&&item.exam.variant==="Aplicação geral");if(!template)continue;
    const expected=question.status==="annulled"?"ANNULLED":question.choices?.find(choice=>choice.correct)?.id;const actual=template.items.find(item=>item.position===question.provenance.officialNumber)?.key;
    if(expected!==actual)mismatches.push(`${edition} Q${question.provenance.officialNumber}: banco ${expected??"?"} × catálogo ${actual??"?"}`);
  }
  return mismatches;
}
