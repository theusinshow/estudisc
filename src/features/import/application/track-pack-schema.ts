import { z } from "zod";
import type { TrackPackV2 } from "./track-pack-v2-schema";

export const stableIdSchema = z.string().trim().min(1);

export const conceptSchema = z.object({
  id: stableIdSchema,
  title: z.string().trim().min(1),
  summary: z.string().optional()
});

export const blockSchema = z
  .object({
    id: stableIdSchema,
    type: z.enum(["text", "concept", "note", "warning", "code", "example", "prediction", "summary"])
  })
  .passthrough();

export const activitySchema = z
  .object({
    id: stableIdSchema,
    type: z.enum(["prediction", "multiple-choice", "explain", "code", "debug"]),
    conceptIds: z.array(stableIdSchema).min(1),
    prompt: z.string().trim().min(1)
  })
  .passthrough();

export const lessonSchema = z.object({
  id: stableIdSchema,
  version: z.number().int().min(1),
  title: z.string().trim().min(1),
  concepts: z.array(conceptSchema),
  blocks: z.array(blockSchema),
  activities: z.array(activitySchema)
});

const moduleSchema = z.object({
  id: stableIdSchema,
  title: z.string().trim().min(1),
  lessons: z.array(lessonSchema)
});

export const trackPackSchema = z.object({
  schema: z.literal("caderno.track.v1"),
  packId: z.string().regex(/^[a-z0-9][a-z0-9._-]{2,127}$/),
  version: z.number().int().min(1),
  language: z.string().default("pt-BR"),
  track: z.object({
    id: stableIdSchema,
    title: z.string().trim().min(1),
    description: z.string().optional(),
    modules: z.array(moduleSchema)
  })
});

export type TrackPackV1 = z.infer<typeof trackPackSchema>;
export type TrackPack = TrackPackV1 | TrackPackV2;
export type TrackPackLesson = TrackPack["track"]["modules"][number]["lessons"][number];
export type TrackPackActivity = TrackPackLesson["activities"][number];
