import { logEvent } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { qaLayers } from "@/features/content-qa/policy";
import { directPublicationSchema } from "@/features/content-qa/direct-publication";
const action=z.discriminatedUnion("action",[
  z.object({action:z.literal("register"),targetType:z.enum(["lesson","question","curriculum"]),stableId:z.string().min(1).max(160),version:z.number().int().positive()}).strict(),
  z.object({action:z.literal("review"),releaseId:z.uuid(),review:z.unknown()}).strict(),
  z.object({action:z.enum(["publish","retire"]),releaseId:z.uuid()}).strict(),
  // One human decision per lesson: all four layers exactly once (ADR 0033).
  z.object({action:z.literal("review_lesson"),lessonId:z.string().min(1).max(160),version:z.number().int().positive(),reviews:z.array(z.object({layer:z.enum(qaLayers)}).passthrough()).length(qaLayers.length).refine(list=>new Set(list.map(r=>r.layer)).size===qaLayers.length,"Each layer exactly once"),publish:z.boolean()}).strict(),
  z.object({action:z.literal("review_lessons"),lessons:z.array(z.object({lessonId:z.string().min(1).max(160),version:z.number().int().positive()}).strict()).min(1).max(40),reviews:z.array(z.object({layer:z.enum(qaLayers)}).passthrough()).length(qaLayers.length).refine(list=>new Set(list.map(r=>r.layer)).size===qaLayers.length,"Each layer exactly once"),publish:z.boolean()}).strict(),
  directPublicationSchema.extend({action:z.literal("publish_lessons_direct")})
]);
export async function POST(request:Request){
  try{
    const profile=await requireAdmin();
    const raw=await request.text();
    if(raw.length>64000)return NextResponse.json({code:"body_too_large"},{status:413});
    const input=action.parse(JSON.parse(raw));
    const repo=new ContentQaRepository();
    let result;
    switch(input.action){
      case "register": result=await repo.register(profile.ownerId,input.targetType,input.stableId,input.version);break;
      case "review": result=await repo.review(profile.ownerId,input.releaseId,input.review);break;
      case "retire": result=await repo.retire(input.releaseId);break;
      case "review_lesson": result=await repo.reviewLesson(profile.ownerId,input.lessonId,input.version,input.reviews,input.publish);break;
      case "review_lessons": result=await repo.reviewLessons(profile.ownerId,input.lessons,input.reviews,input.publish);break;
      case "publish_lessons_direct": result=await repo.publishLessonsDirect(profile,{lessons:input.lessons,reason:input.reason});break;
      case "publish": result=await repo.publish(input.releaseId,profile.ownerId);break;
    }
    logEvent("info","publication_completed",{operation:input.action});return NextResponse.json(result);
  }catch(error){logEvent("error","publication_failure",{operation:"publication",errorType:error instanceof Error?error.name:"UnknownError"});
    return NextResponse.json({code:error instanceof AccessDeniedError?"admin_required":"qa_action_blocked",message:error instanceof Error?error.message:"Invalid request"},{status:error instanceof AccessDeniedError?403:409});
  }
}
