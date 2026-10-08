import { z } from "zod";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
export const authoringContextSchema=z.object({authorId:z.string(),target:lessonVersionPackSchema.shape.target,lesson:trackPackV2Schema.shape.track.shape.modules.element.shape.lessons.element,questionReferences:lessonVersionPackSchema.shape.questionReferences,published:z.boolean(),findings:z.array(z.string())}).strict();
export type AuthoringContext=z.infer<typeof authoringContextSchema>;
export const authoringBlockTypes=["text","note","warning","example","summary","worked-example","concept","code","numeric-explorer"] as const;
export function buildAuthoringPacket(context:AuthoringContext,additions:AuthoringContext["lesson"]["blocks"],packetId:string){return lessonVersionPackSchema.parse({schema:"caderno.lesson.v2",packId:packetId,version:1,authorId:context.authorId,target:context.target,lesson:{...structuredClone(context.lesson),version:context.lesson.version+1,status:"draft",blocks:[...structuredClone(context.lesson.blocks),...additions]},questionReferences:context.questionReferences});}
