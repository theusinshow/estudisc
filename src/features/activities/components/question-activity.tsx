import { getDatabaseUrl } from "@/db/connection";
import { QuestionStudyRepository, QuestionUnavailableError } from "@/db/repositories/question-study-repository";
import { MemoryQuestionStudyRepository } from "@/db/repositories/memory-question-study-repository";
import { getOwnerId } from "@/features/auth/owner";
import type { QuestionReferenceConfig } from "../application/question-reference";
import { QuestionPanel } from "./question-panel";

export async function QuestionActivity({ config,activityStableId,sessionId }: { config: QuestionReferenceConfig;activityStableId:string;sessionId?:string }) {
  let view;
  try {
    const repository=getDatabaseUrl()==="memory://local"?new MemoryQuestionStudyRepository():new QuestionStudyRepository();
    view=await repository.view(await getOwnerId(),activityStableId,config.questionId,config.questionVersion,sessionId);
  } catch(error) {if(!(error instanceof QuestionUnavailableError))throw error;}
  return view?<QuestionPanel question={view.question} hints={view.hints} activityStableId={activityStableId} sessionId={sessionId} lastAnswer={view.lastAnswer} />:<p>Questão indisponível para estudo. Escolha outro exercício publicado.</p>;
}
