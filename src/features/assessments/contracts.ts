import { z } from "zod";
import { questionSchema } from "@/features/questions/contracts";
export const ASSESSMENT_POLICY="assessment.v1";
export const assessmentKinds=["BROAD_DIAGNOSTIC","TARGETED_DIAGNOSTIC","MINI_SIMULATION","SUBJECT_SIMULATION","FULL_SIMULATION","OFFICIAL_EXAM"] as const;
export const assessmentTemplateSchema=z.object({id:z.string().min(1).max(160),version:z.number().int().positive(),title:z.string().min(1),kind:z.enum(assessmentKinds),trackId:z.string().min(1),durationMinutes:z.number().int().min(5).max(240),items:z.array(z.object({id:z.string().min(1),version:z.number().int().positive()}).strict()).min(1).max(28),shuffleChoices:z.boolean().default(false),examId:z.string().optional(),availableAt:z.iso.datetime().optional(),status:z.enum(["draft","published","retired"]).default("draft")}).strict().superRefine((template,context)=>{
  if(new Set(template.items.map(item=>`${item.id}:${item.version}`)).size!==template.items.length)context.addIssue({code:"custom",message:"Duplicate Question version"});
  if(template.kind==="OFFICIAL_EXAM"&&!template.examId)context.addIssue({code:"custom",message:"Official exam identity required"});
  if(["FULL_SIMULATION","BROAD_DIAGNOSTIC","OFFICIAL_EXAM"].includes(template.kind)&&template.items.length!==28)context.addIssue({code:"custom",message:"This assessment requires 28 questions"});
  if(template.kind==="TARGETED_DIAGNOSTIC"&&template.items.length>12)context.addIssue({code:"custom",message:"Targeted diagnostics are bounded to 12 questions"});
});
export const frozenQuestionSchema=z.object({versionId:z.uuid(),question:questionSchema,choiceOrder:z.array(z.string())}).strict();
export const assessmentSnapshotSchema=z.object({kind:z.enum(assessmentKinds),mode:z.enum(["ASSESSMENT","EXAM"]),questions:z.array(frozenQuestionSchema).min(1).max(28),durationMinutes:z.number().int().min(5).max(240),policyVersion:z.literal(ASSESSMENT_POLICY),masteryPolicy:z.literal("mastery.v2"),reviewPolicy:z.literal("review.v2")}).strict();
export type AssessmentTemplate=z.infer<typeof assessmentTemplateSchema>;
export type AssessmentSnapshot=z.infer<typeof assessmentSnapshotSchema>;
export function validateAssessmentComposition(template:AssessmentTemplate,questions:readonly z.infer<typeof questionSchema>[]){
  if(questions.length!==template.items.length)throw new Error("Missing frozen questions");
  if(["BROAD_DIAGNOSTIC","FULL_SIMULATION","OFFICIAL_EXAM"].includes(template.kind))for(const subject of ["MAT","POR","CIE","GH"])if(questions.filter(question=>question.subjectCode===subject).length!==7)throw new Error("Assessment requires seven questions per subject");
  if(template.kind==="SUBJECT_SIMULATION"&&new Set(questions.map(question=>question.subjectCode)).size!==1)throw new Error("Subject simulation must use one subject");
  if(["FULL_SIMULATION","OFFICIAL_EXAM"].includes(template.kind)&&questions.some(question=>question.type==="multiple_choice"&&question.choices?.length!==5))throw new Error("Full exam multiple choice requires five alternatives");
  if(questions.some(question=>question.status!=="published"&&!(template.kind==="OFFICIAL_EXAM"&&question.status==="annulled")))throw new Error("Only published or official annulled questions may enter an assessment");
  if(questions.some(question=>question.exposurePolicy.reservedForAssessment&&(template.kind!=="OFFICIAL_EXAM"||template.examId!==question.provenance.examId)))throw new Error("Reserved question requires its authorized official template");
}
