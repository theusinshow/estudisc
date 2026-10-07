import { z } from "zod";
export const sessionItemSchema=z.object({lessonId:z.string().min(1),version:z.number().int().positive(),title:z.string(),subjectCode:z.string(),minutes:z.number().positive(),activityIds:z.array(z.string()).min(1),questions:z.array(z.object({id:z.string(),version:z.number().int().positive()})),
  trackId:z.string().min(1).optional(),intent:z.enum(["review","remediation","practice","learn"]).optional(),reason:z.string().min(1).optional(),
  caveats:z.array(z.string()).optional(),conceptIds:z.array(z.string()).optional(),delivery:z.enum(["questions","lesson"]).optional(),
  activitySnapshots:z.array(z.object({stableId:z.string().min(1),type:z.literal("question"),prompt:z.string(),orderIndex:z.number().int().nonnegative(),config:z.object({questionId:z.string(),questionVersion:z.number().int().positive(),hints:z.array(z.string()).max(3)})}).strict()).optional()
}).strict().superRefine((item,context)=>{
  if(item.activitySnapshots&&(item.activitySnapshots.length!==item.activityIds.length||item.activitySnapshots.some(activity=>!item.activityIds.includes(activity.stableId)||!item.questions.some(question=>question.id===activity.config.questionId&&question.version===activity.config.questionVersion))))context.addIssue({code:"custom",message:"Activity snapshots must match frozen membership"});
});
export const sessionItemsSchema=z.array(sessionItemSchema).min(1);
export type SessionItem=z.infer<typeof sessionItemSchema>;
export const STUDY_SESSION_POLICY="session.v1";
export const LEGACY_SESSION_BUDGETS=[15,30,60] as const;
export const ADAPTIVE_SESSION_BUDGETS=[10,20,30,45] as const;
export type SessionBudget=10|15|20|30|45|60;
