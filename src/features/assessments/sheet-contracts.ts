import { z } from "zod";
// ADR 0066: answer-sheet assessments for past exams. The key stays server-side; no Question, Attempt or evidence.
export const PAST_EXAM_SHEET="PAST_EXAM_SHEET" as const;
export const SHEET_POLICY="assessment.sheet.v1";
export const sheetLetters=["A","B","C","D","E"] as const;
export const sheetItemCounts=[20,24,28] as const;
export const sheetOutcomes=["correct","incorrect","blank","annulled"] as const;
const sheetKeySchema=z.enum([...sheetLetters,"ANNULLED"]);
const ifscUrl=z.url().refine(value=>new URL(value).host==="www.ifsc.edu.br","Official IFSC host required");
const positionSchema=z.number().int().min(1).max(28);
const count=z.number().int().min(0).max(28);
export const sheetSubjectSchema=z.object({name:z.string().min(1).max(80),start:positionSchema,end:positionSchema}).strict();
export const sheetExamSchema=z.object({examId:z.string().regex(/^ifsc-integrado-\d{4}-[12](-[a-z]+)?$/),edition:z.string().regex(/^\d{4}\.[12]$/),year:z.number().int().min(2000).max(2100),variant:z.string().min(1).max(120),appliedOn:z.iso.date(),examType:z.string().min(1).max(200),publisher:z.string().min(1).max(200)}).strict();
export const pastExamSheetTemplateSchema=z.object({id:z.string().min(1).max(160),version:z.number().int().positive(),title:z.string().min(1).max(160),kind:z.literal(PAST_EXAM_SHEET),trackId:z.string().min(1),durationMinutes:z.number().int().min(5).max(240),availableAt:z.iso.datetime().optional(),status:z.enum(["draft","published","retired"]).default("draft"),exam:sheetExamSchema,subjects:z.array(sheetSubjectSchema).min(1).max(6).optional(),items:z.array(z.object({position:positionSchema,key:sheetKeySchema}).strict()).min(20).max(28),links:z.object({examUrl:ifscUrl,answerKeyUrl:ifscUrl,sourcePage:ifscUrl}).strict(),provenance:z.object({catalogDataset:z.string().min(1),catalogVerifiedAt:z.iso.date(),catalogSha256:z.string().regex(/^[a-f0-9]{64}$/),transcriptionNote:z.string().min(1).max(400),publication:z.object({mode:z.literal("ADMIN_DIRECT"),reason:z.string().min(10).max(500)}).strict()}).strict()}).strict().superRefine((template,context)=>{
  if(!(sheetItemCounts as readonly number[]).includes(template.items.length))context.addIssue({code:"custom",message:"Answer sheets have 20, 24 or 28 items"});
  if(template.items.some((item,index)=>item.position!==index+1))context.addIssue({code:"custom",message:"Positions must run 1..N in order"});
  let next=1;for(const subject of template.subjects??[]){if(subject.start<next||subject.end<subject.start||subject.end>template.items.length)context.addIssue({code:"custom",message:`Subject range ${subject.name} must be ordered, non-overlapping and inside 1..${template.items.length}`});next=subject.end+1;}
});
export type PastExamSheetTemplate=z.infer<typeof pastExamSheetTemplateSchema>;
export const sheetSnapshotSchema=z.object({kind:z.literal(PAST_EXAM_SHEET),mode:z.literal("EXAM"),templateStableId:z.string().min(1),templateVersion:z.number().int().positive(),exam:sheetExamSchema,items:z.array(z.object({position:positionSchema,subject:z.string().optional()}).strict()).min(20).max(28),subjects:z.array(sheetSubjectSchema).optional(),durationMinutes:z.number().int().min(5).max(240),policyVersion:z.literal(SHEET_POLICY)}).strict();
export type SheetSnapshot=z.infer<typeof sheetSnapshotSchema>;
export const sheetAnswerSchema=z.enum(sheetLetters).nullable();
export type SheetAnswer=z.infer<typeof sheetAnswerSchema>;
const tallySchema={correct:count,scored:count,total:count,annulled:count};
export const sheetResultSchema=z.object({kind:z.literal(PAST_EXAM_SHEET),policyVersion:z.literal(SHEET_POLICY),...tallySchema,blank:count,finishedAfterDeadline:z.boolean(),bySubject:z.array(z.object({name:z.string(),...tallySchema}).strict()),byPosition:z.array(z.object({position:positionSchema,subject:z.string().optional(),answer:sheetAnswerSchema,key:sheetKeySchema,outcome:z.enum(sheetOutcomes)}).strict())}).strict();
export type SheetResult=z.infer<typeof sheetResultSchema>;
const hasSheetKind=(value:unknown)=>typeof value==="object"&&value!==null&&(value as {kind?:unknown}).kind===PAST_EXAM_SHEET;
export const isSheetDefinition=hasSheetKind,isSheetSnapshot=hasSheetKind;
export function subjectOf(subjects:PastExamSheetTemplate["subjects"],position:number){return subjects?.find(subject=>position>=subject.start&&position<=subject.end)?.name;}
export function buildSheetSnapshot(template:PastExamSheetTemplate):SheetSnapshot{
  return sheetSnapshotSchema.parse({kind:PAST_EXAM_SHEET,mode:"EXAM",templateStableId:template.id,templateVersion:template.version,exam:template.exam,items:template.items.map(item=>{const subject=subjectOf(template.subjects,item.position);return subject?{position:item.position,subject}:{position:item.position};}),...(template.subjects?{subjects:template.subjects}:{}),durationMinutes:template.durationMinutes,policyVersion:SHEET_POLICY});
}
