import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerId,AccessDeniedError } from "@/features/auth/owner";
import { studySessionRepository } from "@/features/study-sessions/api";
import { SessionStateError } from "@/db/repositories/study-session-repository";
import { getFeatureFlags } from "@/lib/feature-flags";
import { TargetedPracticeError } from "@/features/study-sessions/targeted-selection";
import { practiceBlockTargetSchema,type PracticeBlockTarget } from "@/features/study-sessions/practice-block";
import { denyWithoutFullAccess } from "@/features/payments/activity-access";
// ADR 0072: review and mistake practice start as blocks of up to five Questions; time-budget planning is retired.
const requestSchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("practice_block"),target:practiceBlockTargetSchema}).strict(),
  z.object({action:z.enum(["complete","abandon"]),sessionId:z.uuid()}).strict()
]);
const emptyMessage=(target:PracticeBlockTarget)=>target.kind==="review"&&!target.conceptId?"Sem questões novas para revisar agora. Volte amanhã ou revise a aula.":"Sem questões novas para este conceito agora. Volte amanhã ou revise a aula.";
const unavailable="A revisão ou o erro solicitado não está disponível para esta conta agora.";
const targetMessages:Record<TargetedPracticeError["code"],string>={exam_active:"Termine o simulado antes de praticar.",question_context_unavailable:"Este erro usa uma atividade do laboratório; abra o conceito para retomar essa prática.",target_unavailable:unavailable,review_not_due:unavailable};
export async function POST(request:Request){
  const input=requestSchema.safeParse(await request.json().catch(()=>null));if(!input.success)return NextResponse.json({code:"invalid_request"},{status:400});
  if(input.data.action==="practice_block"&&!getFeatureFlags().FEATURE_SMART_MISTAKES)return NextResponse.json({code:"feature_disabled"},{status:404});
  try{
    const ownerId=await getOwnerId(),repo=studySessionRepository(),data=input.data;
    if(data.action==="practice_block"){
      // Free preview (ADR 0061 §3): a new block needs full access; an open one can still be completed.
      const denied=await denyWithoutFullAccess("A prática de revisão e de erros faz parte do acesso completo do Estudisc.","study_session");if(denied)return denied;
      const block=await repo.startBlock(ownerId,data.target);
      return block?NextResponse.json({sessionId:block.id,status:block.status}):NextResponse.json({code:"content_gap",message:emptyMessage(data.target)},{status:409});
    }
    const session=await repo.transition(ownerId,data.sessionId,data.action);
    return NextResponse.json({sessionId:session.id,status:session.status});
  }catch(error){
    if(error instanceof TargetedPracticeError)return NextResponse.json({code:error.code,message:targetMessages[error.code]},{status:error.code==="target_unavailable"?404:409});
    if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});
    if(error instanceof SessionStateError)return NextResponse.json({code:"session_conflict"},{status:409});
    if(error instanceof Error&&error.message==="DATABASE_URL is not configured")return NextResponse.json({code:"database_not_configured",message:"Configure o banco de dados para iniciar sessões persistentes."},{status:503});
    throw error;
  }
}
