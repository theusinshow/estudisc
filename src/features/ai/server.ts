import "server-only";
import { getDatabaseUrl } from "@/db/connection";
import { CatalogRepository } from "@/db/repositories/catalog-repository";
import { MemoryCatalogRepository } from "@/db/repositories/memory-store";
import { QuestionStudyRepository, QuestionUnavailableError } from "@/db/repositories/question-study-repository";
import { MemoryQuestionStudyRepository } from "@/db/repositories/memory-question-study-repository";
import { StudySessionRepository } from "@/db/repositories/study-session-repository";
import { MemoryStudySessionRepository } from "@/db/repositories/memory-study-session-repository";
import { MistakeRepository } from "@/db/repositories/mistake-repository";
import { MemoryMistakeRepository } from "@/db/repositories/memory/reviews";
import { ConceptRelationRepository, MemoryConceptRelationRepository } from "@/db/repositories/concept-relation-repository";
import { AiLearningRepository, MemoryAiLearningRepository } from "@/db/repositories/ai-learning-repository";
import { DeepSeekGenerationProvider } from "@/features/generation/infrastructure/deepseek-generation-provider.server";
import { getDeepSeekGenerationConfig } from "@/features/generation/infrastructure/deepseek-config.server";
import { AIService, type LearningAiProvider } from "./ai-service";
import { AiLearningError, type AiRequest } from "./contracts";
import { resolveAiContext, type AiContextSources } from "./context";
import { AI_TIMEOUT_MS } from "./usage-policy";

export async function executeLearningAi(ownerId:string,input:AiRequest,signal?:AbortSignal,legacyStyle?:string){
  const memory=getDatabaseUrl()==="memory://local";
  const ledger=memory?new MemoryAiLearningRepository():new AiLearningRepository();
  await ledger.assertAllowed(ownerId);
  const sources:AiContextSources={
    catalog:memory?new MemoryCatalogRepository():new CatalogRepository(),
    questions:memory?new MemoryQuestionStudyRepository():new QuestionStudyRepository(),
    sessions:memory?new MemoryStudySessionRepository():new StudySessionRepository(),
    mistakes:memory?new MemoryMistakeRepository():new MistakeRepository(),
    relations:memory?new MemoryConceptRelationRepository():new ConceptRelationRepository()
  };
  try{
    const resolved=await resolveAiContext(ownerId,input,sources);
    const context=legacyStyle?{...resolved,facts:{...resolved.facts,requestedStyle:legacyStyle}}:resolved;
    const config=getDeepSeekGenerationConfig();
    const provider:LearningAiProvider={id:"deepseek",model:config.defaultModel,configured:config.status==="configured",assist:(prompt,abort)=>new DeepSeekGenerationProvider(undefined,undefined,AI_TIMEOUT_MS).assist(prompt,abort)};
    return await new AIService(provider,ledger).execute(ownerId,input,context,signal);
  }catch(error){if(error instanceof QuestionUnavailableError)throw new AiLearningError("context_unavailable");throw error;}
}
