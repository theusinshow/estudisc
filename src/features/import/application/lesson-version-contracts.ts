import { z } from "zod";
import { trackPackV2Schema } from "./track-pack-v2-schema";
import { questionSchema } from "@/features/questions/contracts";
const id = z.string().trim().min(1).max(160), hash = z.string().regex(/^[a-f0-9]{64}$/);
const version = z.number().int().positive().max(2147483647);
export const lessonVersionPackSchema = z.object({
  schema: z.literal("caderno.lesson.v2"), packId: z.string().regex(/^[a-z0-9][a-z0-9._-]{2,127}$/), version,
  authorId: id,
  target: z.object({ trackId: id, trackVersion: version, moduleId: id, lessonId: id, baseVersion: version, baseHash: hash }).strict(),
  lesson: trackPackV2Schema.shape.track.shape.modules.element.shape.lessons.element.extend({ version }),
  questionReferences: z.array(z.object({ id, version, hash }).strict()).max(200),
  // ADR 0063: new lesson-bound Question versions (next version of an owned Question, or a new Question at version 1).
  questionVersions: z.array(questionSchema).max(200).optional(),
  // ADR 0062: optional correction of listed published blocks; absent means append-only enrichment.
  corrections: z.object({
    reason: z.string().trim().min(10).max(500),
    blocks: z.array(z.object({ blockId: id, action: z.enum(["replace", "remove"]), baseBlockHash: hash }).strict()).min(1).max(200)
  }).strict().optional()
}).strict();
export type LessonVersionPack = z.infer<typeof lessonVersionPackSchema>;
export class LessonVersionConflictError extends Error { constructor(message: string) { super(message); this.name = "LessonVersionConflictError"; } }
export type LessonVersionResult = { status: "ready" | "imported" | "already_imported"; packId: string; version: number; trackId: string; lessonId: string; lessonVersion: number };
export interface LessonVersionRepository { executeLessonVersion(pack: LessonVersionPack, contentHash: string, preview: boolean): Promise<LessonVersionResult> }
