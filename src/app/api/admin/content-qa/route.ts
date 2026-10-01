import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
const action=z.discriminatedUnion("action",[
  z.object({action:z.literal("register"),targetType:z.enum(["lesson","question","curriculum"]),stableId:z.string().min(1).max(160),version:z.number().int().positive()}).strict(),
  z.object({action:z.literal("review"),releaseId:z.uuid(),review:z.unknown()}).strict(),
  z.object({action:z.enum(["publish","retire"]),releaseId:z.uuid()}).strict()
]);
export async function POST(request:Request){try{const profile=await requireAdmin();const raw=await request.text();if(raw.length>64000)return NextResponse.json({code:"body_too_large"},{status:413});const input=action.parse(JSON.parse(raw));const repo=new ContentQaRepository();const result=input.action==="register"?await repo.register(profile.ownerId,input.targetType,input.stableId,input.version):input.action==="review"?await repo.review(profile.ownerId,input.releaseId,input.review):input.action==="retire"?await repo.retire(input.releaseId):await repo.publish(input.releaseId);return NextResponse.json(result);}catch(error){return NextResponse.json({code:error instanceof AccessDeniedError?"admin_required":"qa_action_blocked",message:error instanceof Error?error.message:"Invalid request"},{status:error instanceof AccessDeniedError?403:409});}}
