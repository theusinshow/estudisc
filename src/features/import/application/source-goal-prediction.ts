import {z} from "zod";
import {titledTextBlockSchema} from "@/features/lessons/blocks/block-schemas";
import {hashCanonicalJson} from "@/lib/canonical-json";
import type {TrackPackV2} from "./track-pack-v2-schema";
const quote=z.string().min(12).max(2000);
export const sourceGoalPredictionProofSchema=z.object({
  purpose:z.literal("exploration"),sourceBlockId:z.string().min(1),sourceBlockHash:z.string().regex(/^[a-f0-9]{64}$/),sourceQuote:quote,promptQuote:quote,
  objective:z.string().min(12).max(1000),objectiveProvenance:z.literal("SOURCE_DERIVED_PROPOSAL"),conceptId:z.string().min(1),conceptMappingProvenance:z.literal("SOURCE_DERIVED_PROPOSAL"),
  selectionBasis:z.literal("source_goal_exception"),exceptionReason:z.string().min(20).max(1000),recipeHash:z.string().regex(/^[a-f0-9]{64}$/),reviewStatus:z.literal("community_feedback_pending")
}).strict();
export const sourceGoalPredictionSchema=titledTextBlockSchema.extend({type:z.literal("prediction"),observation:quote,explanation:quote,contentStudio:z.object({enrichment:sourceGoalPredictionProofSchema}).strict()}).strict();
type Lesson=TrackPackV2["track"]["modules"][number]["lessons"][number];
export function validateSourceGoalPrediction(block:Lesson["blocks"][number],base:Lesson){
 const payload=sourceGoalPredictionSchema.parse(block.payload),proof=payload.contentStudio.enrichment,anchor=base.blocks.find(b=>b.id===proof.sourceBlockId);
 if(base.objectives.length||!anchor||anchor.type!=="worked-example"||anchor.conceptIds.length||hashCanonicalJson(anchor)!==proof.sourceBlockHash||typeof anchor.payload.content!=="string")throw new Error("Source-goal prediction requires the actual missing-goal/unmapped worked source");
 if(block.conceptIds.length!==1||block.conceptIds[0]!==proof.conceptId||!base.concepts.some(c=>c.id===proof.conceptId))throw new Error("Proposed Concept mapping must use an existing lesson Concept");
 for(const text of [proof.sourceQuote,proof.promptQuote,payload.observation,payload.explanation])if(!anchor.payload.content.includes(text))throw new Error("Prediction quotes must come from the unchanged authored source");
 if(payload.content!==`Objetivo proposto desta exploração: ${proof.objective}\n\n${proof.promptQuote}`)throw new Error("Display the proposed goal and actual source prompt without rewriting them");
 return payload;
}
