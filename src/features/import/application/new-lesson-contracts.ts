import { z } from "zod";
import { contentSourceSchema } from "@/features/curriculum/contracts";
import { questionSchema } from "@/features/questions/contracts";
import { trackPackV2Schema } from "./track-pack-v2-schema";
const id = z.string().trim().min(1).max(160);
const version = z.number().int().positive().max(2147483647);
/** ADR 0064: appends one new draft lesson (version 1) with its new Concepts, Questions and sources to an imported Track version. */
export const newLessonPackSchema = z.object({
  schema: z.literal("caderno.lesson-new.v1"), packId: z.string().regex(/^[a-z0-9][a-z0-9._-]{2,127}$/), version,
  authorId: id,
  target: z.object({ trackId: id, trackVersion: version, moduleId: id }).strict(),
  lesson: trackPackV2Schema.shape.track.shape.modules.element.shape.lessons.element.extend({ version }),
  questions: z.array(questionSchema).min(1).max(200),
  sources: z.array(contentSourceSchema).max(50).default([])
}).strict();
export type NewLessonPack = z.infer<typeof newLessonPackSchema>;
export type NewLessonResult = { status: "ready" | "imported" | "already_imported"; packId: string; version: number; trackId: string; moduleId: string; lessonId: string; lessonVersion: number };
export interface NewLessonRepository { executeNewLesson(pack: NewLessonPack, contentHash: string, preview: boolean): Promise<NewLessonResult> }
