import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerId,AccessDeniedError } from "@/features/auth/owner";
import { studySessionRepository } from "@/features/study-sessions/api";
import { SessionStateError } from "@/db/repositories/study-session-repository";
import { RoutineConflictError } from "@/features/study-sessions/routine-contracts";
import { getFeatureFlags } from "@/lib/feature-flags";
import { TargetedPracticeError } from "@/features/study-sessions/targeted-selection";
const retrievalBudget=z.union([z.literal(10),z.literal(15)]);
const requestSchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("plan"),budgetMinutes:z.union([z.literal(10),z.literal(15),z.literal(20),z.literal(30),z.literal(45),z.literal(60)])}).strict(),
  z.object({action:z.literal("quick_review"),budgetMinutes:retrievalBudget,conceptId:z.string().trim().min(1).max(160).optional()}).strict(),
  z.object({action:z.literal("practice_mistake"),budgetMinutes:retrievalBudget,mistakeId:z.uuid()}).strict(),
  z.object({action:z.enum(["start","complete","abandon"]),sessionId:z.uuid()}).strict()
]);
export async function POST(request:Request){
  const input=requestSchema.safeParse(await request.json().catch(()=>null));if(!input.success)return NextResponse.json({code:"invalid_request"},{status:400});
  if(input.data.action==="plan"&&[10,20,45].includes(input.data.budgetMinutes)&&!getFeatureFlags().FEATURE_ADAPTIVE_SESSION)return NextResponse.json({code:"invalid_request"},{status:400});
  if((input.data.action==="quick_review"||input.data.action==="practice_mistake")&&!getFeatureFlags().FEATURE_SMART_MISTAKES)return NextResponse.json({code:"feature_disabled"},{status:404});
  try{
    const ownerId=await getOwnerId(),repo=studySessionRepository(),data=input.data;
    const session=data.action==="plan"?await repo.plan(ownerId,data.budgetMinutes)
      :data.action==="quick_review"?await repo.plan(ownerId,data.budgetMinutes,new Date(),{kind:"review",conceptId:data.conceptId})
      :data.action==="practice_mistake"?await repo.plan(ownerId,data.budgetMinutes,new Date(),{kind:"remediation",mistakeId:data.mistakeId})
      :await repo.transition(ownerId,data.sessionId,data.action);
    return session?NextResponse.json({sessionId:session.id,status:session.status}):NextResponse.json({code:"content_gap",message:"Não há uma questão publicada e elegível para esta prática agora."},{status:409});
  }catch(error){
    if(error instanceof TargetedPracticeError)return NextResponse.json({code:error.code,message:error.code==="exam_active"?"Conclua o simulado em modo prova antes de abrir outra prática.":error.code==="question_context_unavailable"?"Este erro usa uma atividade do laboratório; abra o conceito para retomar essa prática.":"A revisão ou o erro solicitado não está disponível para esta conta agora."},{status:error.code==="target_unavailable"?404:409});
    if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});if(error instanceof RoutineConflictError)return NextResponse.json({code:error.code,message:"Esta sessão não cabe na rotina de hoje. Confira o plano ou ajuste o tempo antes de começar."},{status:409});if(error instanceof SessionStateError)return NextResponse.json({code:"session_conflict"},{status:409});if(error instanceof Error&&error.message==="DATABASE_URL is not configured")return NextResponse.json({code:"database_not_configured",message:"Configure o banco de dados para iniciar sessões persistentes."},{status:503});throw error;
  }
}
