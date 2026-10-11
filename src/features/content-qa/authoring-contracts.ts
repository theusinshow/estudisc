import { z } from "zod";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { assessedLessonVersionPackSchema, lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { hashCanonicalJson } from "@/lib/canonical-json";
import type { Question } from "@/features/questions/contracts";
export const authoringContextSchema=z.object({authorId:z.string(),target:lessonVersionPackSchema.shape.target,lesson:trackPackV2Schema.shape.track.shape.modules.element.shape.lessons.element,questionReferences:lessonVersionPackSchema.shape.questionReferences,published:z.boolean(),findings:z.array(z.string())}).strict();
export type AuthoringContext=z.infer<typeof authoringContextSchema>;
export const authoringBlockTypes=["text","note","warning","example","summary","worked-example","concept","code","numeric-explorer"] as const;
export function buildAuthoringPacket(context:AuthoringContext,additions:AuthoringContext["lesson"]["blocks"],packetId:string){return lessonVersionPackSchema.parse({schema:"caderno.lesson.v2",packId:packetId,version:1,authorId:context.authorId,target:context.target,lesson:{...structuredClone(context.lesson),version:context.lesson.version+1,status:"draft",blocks:[...structuredClone(context.lesson.blocks),...additions]},questionReferences:context.questionReferences});}
/** ADR 0060's intentionally narrow authoring entry point. The caller supplies
 * original Question content; this helper never derives an answer key or score. */
export function buildAssessedEnrichmentPacket(context:AuthoringContext,questions:readonly Question[],activities:AuthoringContext["lesson"]["activities"],packetId:string){
  const lesson={...structuredClone(context.lesson),version:context.lesson.version+1,status:"draft" as const,activities:[...structuredClone(context.lesson.activities),...structuredClone(activities)]};
  return assessedLessonVersionPackSchema.parse({schema:"caderno.lesson.v3",packId:packetId,version:1,authorId:context.authorId,target:context.target,lesson,questionReferences:[...context.questionReferences,...questions.map(question=>({id:question.id,version:question.version,hash:hashCanonicalJson(question)}))],newQuestions:questions});
}
