import { z } from "zod";
import { lessonBlueprintSchema } from "./blueprint-contracts";
import { numericExplorerSchema } from "@/features/lessons/blocks/numeric-explorer-schema";

const id = z.string().trim().min(1).max(160), hash = z.string().regex(/^[a-f0-9]{64}$/);
/** Authoring proposal only. No approval, arbitrary code, grade or public asset fields. */
export const enrichmentRecipeSchema = z.object({
  schemaVersion: z.literal(1), identity: lessonBlueprintSchema.shape.identity,
  sourceLessonHash: hash, newVersion: z.number().int().positive(), authorId: id,
  additions: z.array(z.object({ newBlockId: id, afterBlockId: id, sourceBlockHash: hash,
    sourceQuote: z.string().trim().min(12).max(2000), conceptId: id, objective: z.string().trim().min(1).max(1000),
    purpose: z.literal("exploration"), type: z.literal("numeric-explorer"),
    parameters: numericExplorerSchema.options[0].omit({ mode: true }).strict(), expectedInitialResult: z.number().finite()
  }).strict()).min(1).max(3)
}).strict();
export type EnrichmentRecipe = z.infer<typeof enrichmentRecipeSchema>;
