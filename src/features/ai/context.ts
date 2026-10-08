import type { CatalogRepository } from "@/db/repositories/catalog-repository";
import type { QuestionStudyRepository } from "@/db/repositories/question-study-repository";
import type { StudySessionRepository } from "@/db/repositories/study-session-repository";
import type { MistakeRepository } from "@/db/repositories/mistake-repository";
import type { ConceptRelationRepository } from "@/db/repositories/concept-relation-repository";
import { groupMistakeObservations } from "@/features/mistakes/mistake-patterns";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { AiLearningError, type AiContext, type AiRequest } from "./contracts";

export type AiContextSources = {
  catalog: Pick<CatalogRepository,"getLesson"|"getConcept">;
  questions: {
    aiContext: QuestionStudyRepository["aiContext"];
    view: (...args: Parameters<QuestionStudyRepository["view"]>) => Promise<unknown>;
    interact: (...args: Parameters<QuestionStudyRepository["interact"]>) => Promise<unknown>;
  };
  sessions: Pick<StudySessionRepository,"result">;
  mistakes: Pick<MistakeRepository,"listMistakes">;
  relations: Pick<ConceptRelationRepository,"get">;
};
const text=(value:string|null|undefined,max=3500)=>(value??"").replace(/(?:https?:\/\/|data:|blob:)[^\s)]+|\/(?:api\/(?:question-)?assets|assets|images|media)\/[^\s)]+/g,"[link omitido]").slice(0,max);
const unavailable=()=>new AiLearningError("context_unavailable");
export async function resolveAiContext(ownerId:string,input:AiRequest,sources:AiContextSources):Promise<AiContext>{
  const target=input.target;
  if(target.kind==="question"){
    const source=await sources.questions.aiContext(ownerId,target.activityId,target.questionId,target.questionVersion,target.sessionId);
    return {sourceKey:source.sourceKey,facts:{stem:text(source.question.stem),stimulus:text(source.question.stimulus,2000),authoredExplanation:text(source.question.explanation),authoredHints:source.hints.map(h=>text(h,500)),excerptOnly:true},
      attestAssistance:async()=>{
        await sources.questions.view(ownerId,target.activityId,target.questionId,target.questionVersion,target.sessionId);
        await sources.questions.interact(ownerId,target.activityId,{action:"solution",questionId:target.questionId,questionVersion:target.questionVersion,sessionId:target.sessionId,submissionKey:crypto.randomUUID(),response:null});
      }};
  }
  if(target.kind==="lesson"){
    const lesson=await sources.catalog.getLesson(target.lessonId,target.version,target.trackId,true);
    const block=lesson?.blocks.find(row=>row.stableId===target.blockId&&["text","concept","note","warning","example","worked-example","summary"].includes(row.type));
    const payload=block?.payload as {content?:unknown;steps?:unknown}|undefined;
    const content=typeof payload?.content==="string"?payload.content:Array.isArray(payload?.steps)?payload.steps.filter((row):row is string=>typeof row==="string").join("\n"):null;
    if(!lesson||!block||!content)throw unavailable();
    return {sourceKey:hashCanonicalJson({scope:target,block}),facts:{lessonTitle:text(lesson.title,200),excerpt:text(content,6000),excerptOnly:true,concepts:lesson.concepts.slice(0,5).map(c=>text(c.title,200))}};
  }
  if(target.kind==="mistakes"){
    const groups=groupMistakeObservations(await sources.mistakes.listMistakes(ownerId)).filter(group=>!target.conceptId||group.conceptId===target.conceptId).slice(0,10);
    if(!groups.length)throw unavailable();
    const facts={observations:groups.map(group=>({concept:text(group.conceptTitle,200),distinctAttempts:group.attemptIds.length,activeRecords:group.activeCount,resolvedRecords:group.resolvedCount,recurring:group.recurring,cause:"Não estabelecida pelos registros."})),diagnosisEstablished:false};
    return {sourceKey:hashCanonicalJson({scope:target,groups}),facts};
  }
  if(target.kind==="session"){
    const result=await sources.sessions.result(ownerId,target.sessionId);
    if(!result||result.session.status!=="COMPLETED")throw unavailable();
    const summary=result.summary;
    const facts={attempts:summary.attempts,answered:summary.answered,correct:summary.correct,wallMinutes:summary.wallMinutes,plannedMinutes:summary.plannedMinutes,independentConcepts:summary.independentConcepts.slice(0,10).map(c=>text(c.title,200)),reviewedConcepts:summary.reviewedConcepts};
    return {sourceKey:hashCanonicalJson({scope:target,summary,items:result.items}),facts};
  }
  const edge=await sources.relations.get(target.conceptId,target.relatedConceptId);
  if(!edge||!["required","recommended"].includes(edge.strength))throw unavailable();
  const pair=await Promise.all([target.conceptId,target.relatedConceptId].map(async id=>{
    const concept=await sources.catalog.getConcept(id);
    if(!concept)throw unavailable();
    const published=await Promise.all(concept.lessons.map(lesson=>sources.catalog.getLesson(lesson.stableId,undefined,undefined,true)));
    if(!published.some(lesson=>lesson?.concepts.some(c=>c.stableId===id)))throw unavailable();
    return {title:text(concept.title,200),summary:text(concept.summary,1500)};
  }));
  return {sourceKey:hashCanonicalJson({scope:target,edge,pair}),facts:{concept:pair[0],prerequisite:pair[1],strength:edge.strength,relation:edge.strength==="required"?"Este pré-requisito é declarado obrigatório para o conceito.":"A relação curricular recomenda este outro conceito como apoio.",officialMappingCertified:false}};
}
