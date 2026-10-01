import { z } from "zod";
export const sessionItemSchema=z.object({lessonId:z.string().min(1),version:z.number().int().positive(),title:z.string(),subjectCode:z.string(),minutes:z.number().positive(),activityIds:z.array(z.string()).min(1),questions:z.array(z.object({id:z.string(),version:z.number().int().positive()}))}).strict();
export const sessionItemsSchema=z.array(sessionItemSchema).min(1);
export type SessionItem=z.infer<typeof sessionItemSchema>;
export const STUDY_SESSION_POLICY="session.v1";
