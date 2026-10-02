import { NextResponse } from "next/server";
import { AccessDeniedError } from "@/features/auth/owner";
import { getLesson } from "@/features/lessons/api";
import { getLessonProgress } from "@/features/progress/api";
export const runtime="nodejs";export const dynamic="force-dynamic";
// Read-only: lets the lesson page refresh its progress card without re-rendering (and re-exposing) its questions.
export async function GET(_request:Request,{params}:{params:Promise<{lessonId:string}>}){
  try{
    const lesson=await getLesson((await params).lessonId);
    if(!lesson)return NextResponse.json({code:"not_found"},{status:404});
    return NextResponse.json(await getLessonProgress(lesson.stableId,lesson.concepts.map(concept=>concept.stableId)),{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"access_denied"},{status:403});throw error;}
}
