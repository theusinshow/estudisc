import { z } from "zod";

export const directPublicationSchema = z.object({
  lessons: z.array(z.object({
    lessonId: z.string().trim().min(1).max(160),
    version: z.number().int().positive()
  }).strict()).min(1).max(40).refine(
    targets => new Set(targets.map(target => target.lessonId)).size === targets.length,
    "Select each lesson only once, with an explicit version"
  ),
  reason: z.string().trim().min(20).max(3000)
}).strict();

export type DirectPublicationInput = z.infer<typeof directPublicationSchema>;
