import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerId,AccessDeniedError } from "@/features/auth/owner";
import { studySessionRepository } from "@/features/study-sessions/api";
import { SessionStateError } from "@/db/repositories/study-session-repository";
import { RoutineConflictError } from "@/features/study-sessions/routine-contracts";
const requestSchema=z.discriminatedUnion("action",[z.object({action:z.literal("plan"),budgetMinutes:z.union([z.literal(15),z.literal(30),z.literal(60)])}).strict(),z.object({action:z.enum(["start","complete","abandon"]),sessionId:z.uuid()}).strict()]);
export async function POST(request:Request){
  const input=requestSchema.safeParse(await request.json().catch(()=>null));if(!input.success)return NextResponse.json({code:"invalid_request"},{status:400});
  try{const ownerId=await getOwnerId();const repo=studySessionRepository();const session=input.data.action==="plan"?await repo.plan(ownerId,input.data.budgetMinutes):await repo.transition(ownerId,input.data.sessionId,input.data.action);return session?NextResponse.json({sessionId:session.id,status:session.status}):NextResponse.json({code:"content_gap",message:"Ainda não há conteúdo publicado disponível para este plano."},{status:409});}
  catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});if(error instanceof RoutineConflictError)return NextResponse.json({code:error.code,message:"Esta sessão não cabe na rotina de hoje. Confira o plano ou ajuste o tempo antes de começar."},{status:409});if(error instanceof SessionStateError)return NextResponse.json({code:"session_conflict"},{status:409});if(error instanceof Error&&error.message==="DATABASE_URL is not configured")return NextResponse.json({code:"database_not_configured",message:"Configure o banco de dados para iniciar sessões persistentes."},{status:503});throw error;}
}
