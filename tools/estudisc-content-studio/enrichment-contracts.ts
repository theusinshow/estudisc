import { z } from "zod";
import { lessonBlueprintSchema } from "./blueprint-contracts";
import { linearExplorerSchema, numericExplorerSchema } from "@/features/lessons/blocks/numeric-explorer-schema";

const id = z.string().trim().min(1).max(160), hash = z.string().regex(/^[a-f0-9]{64}$/);
/** Authoring proposal only. No approval, arbitrary code, grade or public asset fields. */
export const numericEnrichmentRecipeSchema = z.object({
  schemaVersion: z.literal(1), identity: lessonBlueprintSchema.shape.identity,
  sourceLessonHash: hash, newVersion: z.number().int().positive(), authorId: id,
  additions: z.array(z.object({ newBlockId: id, afterBlockId: id, sourceBlockHash: hash,
    sourceQuote: z.string().trim().min(12).max(2000), conceptId: id, objective: z.string().trim().min(1).max(1000),
    purpose: z.literal("exploration"), type: z.literal("numeric-explorer"),
    parameters: z.union([numericExplorerSchema.options[0].omit({ mode: true }).strict(), linearExplorerSchema.strict()]), expectedInitialResult: z.number().finite()
  }).strict()).min(1).max(3)
}).strict();
export const predictionEnrichmentRecipeSchema = z.object({
  schemaVersion:z.literal(2),identity:lessonBlueprintSchema.shape.identity,
  sourceLessonHash:hash,newVersion:z.number().int().positive(),authorId:id,
  selectionBasis:z.literal("source_goal_exception"),exceptionReason:z.string().trim().min(20).max(1000),
  additions:z.array(z.object({newBlockId:id,beforeBlockId:id,sourceBlockHash:hash,sourceQuote:z.string().min(12).max(2000),conceptId:id,
    purpose:z.literal("exploration"),type:z.literal("prediction"),goalOrigin:z.literal("SOURCE_DERIVED_PROPOSAL"),proposedGoal:z.string().trim().min(12).max(1000),
    parameters:z.object({title:z.string().trim().min(1).max(160),promptQuote:z.string().min(12).max(2000),observationQuote:z.string().min(12).max(2000),explanationQuote:z.string().min(12).max(2000)}).strict()
  }).strict()).min(1).max(3)
}).strict();
export const enrichmentRecipeSchema=z.discriminatedUnion("schemaVersion",[numericEnrichmentRecipeSchema,predictionEnrichmentRecipeSchema]);
export type EnrichmentRecipe = z.infer<typeof enrichmentRecipeSchema>;
