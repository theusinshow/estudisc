import { z } from "zod";
export const questionReferenceSchema = z.object({ questionId: z.string().min(1), questionVersion: z.number().int().positive(), hints: z.array(z.string()).max(3).default([]) });
export type QuestionReferenceConfig = z.infer<typeof questionReferenceSchema>;
