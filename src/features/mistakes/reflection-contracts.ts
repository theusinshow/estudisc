import { z } from "zod";
import { pedagogicalMistakeCategories } from "./mistake-patterns";
export const mistakeReflectionSchema=z.object({mistakeId:z.uuid(),mutationId:z.uuid(),category:z.enum(pedagogicalMistakeCategories),note:z.string().trim().max(1000).default("")}).strict();
export type MistakeReflectionInput=z.infer<typeof mistakeReflectionSchema>;
export const mistakeReflectionPayloadSchema=mistakeReflectionSchema.extend({basis:z.literal("student_report"),canonicalEvidence:z.literal(false)}).strict();
export type MistakeReflection=Readonly<{id:string;mistakeId:string;category:MistakeReflectionInput["category"];note:string;createdAt:Date}>;
