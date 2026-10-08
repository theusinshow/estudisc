import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerId } from "@/features/auth/owner";
import { aiRequestSchema } from "@/features/ai/contracts";
import { executeLearningAi } from "@/features/ai/server";
import { aiHttpError } from "@/features/ai/http-errors";

const inputSchema=z.object({activityId:z.string().min(1).max(160),questionId:z.string().min(1).max(160),questionVersion:z.number().int().positive(),sessionId:z.uuid().optional(),mode:z.enum(["SOCRATIC","EXPLAIN","REVIEW","QUESTION_HELP"]),message:z.string().trim().min(1).max(1000)}).strict();
/** Legacy requests share owner/context/usage controls; no bypass route. */
export async function POST(request:Request){try{
  const owner=await getOwnerId(),raw=await request.text();
  if(raw.length>4000)return NextResponse.json({code:"body_too_large"},{status:413});
  const input=inputSchema.safeParse(JSON.parse(raw));
  if(!input.success)return NextResponse.json({code:"invalid_request"},{status:400});
  const data=input.data;
  const action=aiRequestSchema.parse({requestId:crypto.randomUUID(),action:data.mode==="SOCRATIC"||data.mode==="QUESTION_HELP"?"give_hint":"explain_differently",message:data.message,target:{kind:"question",activityId:data.activityId,questionId:data.questionId,questionVersion:data.questionVersion,sessionId:data.sessionId}});
  return NextResponse.json(await executeLearningAi(owner,action,request.signal,data.mode));
}catch(error){if(error instanceof SyntaxError)return NextResponse.json({code:"invalid_request"},{status:400});return aiHttpError(error);}}
