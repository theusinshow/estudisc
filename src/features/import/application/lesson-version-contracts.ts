import { z } from "zod";
import { trackPackV2Schema } from "./track-pack-v2-schema";
import { questionSchema } from "@/features/questions/contracts";
const id = z.string().trim().min(1).max(160), hash = z.string().regex(/^[a-f0-9]{64}$/);
const version = z.number().int().positive().max(2147483647);
const targetSchema = z.object({ trackId: id, trackVersion: version, moduleId: id, lessonId: id, baseVersion: version, baseHash: hash }).strict();
const questionReferenceSchema = z.object({ id, version, hash }).strict();
const lessonSchema = trackPackV2Schema.shape.track.shape.modules.element.shape.lessons.element.extend({ version });
export const lessonVersionPackSchema = z.object({
  schema: z.literal("caderno.lesson.v2"), packId: z.string().regex(/^[a-z0-9][a-z0-9._-]{2,127}$/), version,
  authorId: id,
  target: targetSchema, lesson: lessonSchema, questionReferences: z.array(questionReferenceSchema).max(200)
}).strict();
export type LessonVersionPack = z.infer<typeof lessonVersionPackSchema>;
/**
 * ADR 0060: a v3 packet is the only targeted path that can append scored
 * training Questions. It deliberately remains separate from the v2 block-only
 * envelope so old packets retain their exact rejection policy.
 */
export const assessedLessonVersionPackSchema = z.object({
  schema: z.literal("caderno.lesson.v3"), packId: z.string().regex(/^[a-z0-9][a-z0-9._-]{2,127}$/), version,
  authorId: id, target: targetSchema, lesson: lessonSchema,
  questionReferences: z.array(questionReferenceSchema).min(1).max(220),
  newQuestions: z.array(questionSchema).min(1).max(12)
}).strict();
export type AssessedLessonVersionPack = z.infer<typeof assessedLessonVersionPackSchema>;
export const lessonVersionPacketSchema = z.discriminatedUnion("schema", [lessonVersionPackSchema, assessedLessonVersionPackSchema]);
export type LessonVersionPacket = z.infer<typeof lessonVersionPacketSchema>;
export class LessonVersionConflictError extends Error { constructor(message: string) { super(message); this.name = "LessonVersionConflictError"; } }
export type LessonVersionResult = { status: "ready" | "imported" | "already_imported"; packId: string; version: number; trackId: string; lessonId: string; lessonVersion: number };
export interface LessonVersionRepository { executeLessonVersion(pack: LessonVersionPacket, contentHash: string, preview: boolean): Promise<LessonVersionResult> }
