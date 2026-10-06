import { z } from "zod";

export const lessonReviewOutcomeSchema = z.object({
  recorded: z.number().int().nonnegative(),
  published: z.boolean(),
  releases: z.number().int().positive()
});
export const lessonReviewsResponseSchema = z.object({ results: z.array(
  z.discriminatedUnion("ok", [
    lessonReviewOutcomeSchema.extend({ ok: z.literal(true), lessonId: z.string(), version: z.number().int().positive() }),
    z.object({ ok: z.literal(false), lessonId: z.string(), version: z.number().int().positive(), error: z.string() })
  ])
) });
