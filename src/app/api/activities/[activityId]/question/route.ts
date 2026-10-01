import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabaseUrl } from "@/db/connection";
import { QuestionStudyRepository, QuestionUnavailableError, SubmissionConflictError } from "@/db/repositories/question-study-repository";
import { MemoryQuestionStudyRepository } from "@/db/repositories/memory-question-study-repository";
import { AccessDeniedError, getOwnerId } from "@/features/auth/owner";
export const runtime="nodejs";export const dynamic="force-dynamic";
const requestSchema=z.object({questionId:z.string().min(1).max(160),questionVersion:z.number().int().positive(),action:z.enum(["submit","hint","solution"]),submissionKey:z.uuid(),response:z.json(),sessionId:z.uuid().optional()}).strict();
export async function POST(request:Request,{params}:{params:Promise<{activityId:string}>}){
  if(Number(request.headers.get("content-length")??0)>20000)return NextResponse.json({code:"too_large"},{status:413});
  const raw=await request.text();if(raw.length>20000)return NextResponse.json({code:"too_large"},{status:413});
  let data;try{data=requestSchema.safeParse(JSON.parse(raw));}catch{return NextResponse.json({code:"invalid_request"},{status:400});}
  if(!data.success)return NextResponse.json({code:"invalid_request"},{status:400});
  try{const repository=getDatabaseUrl()==="memory://local"?new MemoryQuestionStudyRepository():new QuestionStudyRepository();return NextResponse.json(await repository.interact(await getOwnerId(),(await params).activityId,data.data));}
  catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});if(error instanceof QuestionUnavailableError)return NextResponse.json({code:"question_unavailable"},{status:404});if(error instanceof SubmissionConflictError)return NextResponse.json({code:"submission_conflict"},{status:409});throw error;}
}
