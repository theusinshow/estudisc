import { NextResponse } from "next/server";
import { AccessDeniedError } from "@/features/auth/owner";
import { AiLearningError } from "./contracts";

export function aiHttpError(error:unknown){
  if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden",message:"Entre na sua conta para consultar a IA."},{status:403});
  const code=error instanceof AiLearningError?error.code:"unavailable";
  const message=code==="exam_active"?"A IA fica desativada durante provas. Conclua a prova para voltar a consultar."
    :code==="context_unavailable"?"Este conteúdo não está disponível para a consulta. Continue pela aula ou escolha outro trecho."
    :code==="rate_limited"||code==="daily_limit"?"Você atingiu o limite de consultas. Continue pelas explicações da aula e tente mais tarde."
    :code==="request_pending"?"Há consultas em andamento. Aguarde ou tente novamente em instantes."
    :code==="request_conflict"?"A consulta mudou. Inicie uma nova consulta."
    :code==="cancelled"?"Consulta cancelada. Você pode continuar estudando."
    :"IA opcional indisponível. As dicas e explicações da aula continuam disponíveis.";
  const status=code==="rate_limited"||code==="daily_limit"?429:code==="exam_active"||code==="context_unavailable"||code==="request_pending"||code==="request_conflict"?409:code==="cancelled"?408:503;
  return NextResponse.json({code,message,assisted:error instanceof AiLearningError&&error.assisted},{status});
}
