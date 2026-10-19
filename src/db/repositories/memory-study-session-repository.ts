import { getMemoryStore } from "./memory-store";
import { SessionStateError, type StudySessionRepository } from "./study-session-repository";
import { sessionItemsSchema } from "@/features/study-sessions/contracts";
import { planCandidates } from "@/features/study-sessions/planner-policy";
import { memoryAdaptiveChoices } from "./memory-adaptive-session-data";
import { summarizeSession } from "@/features/study-sessions/session-summary";
import { TargetedPracticeError } from "@/features/study-sessions/targeted-selection";
import { PRACTICE_BLOCK_MINUTES, capBlockItems, practiceBlockPolicy, toBlockAnswer, type PracticeBlockTarget } from "@/features/study-sessions/practice-block";
import { memoryTargetedSelection } from "./targeted-session-selection";
/** ADR 0072: mirrors StudySessionRepository (practice blocks only). */
export class MemoryStudySessionRepository{
  constructor(private readonly store=getMemoryStore()){}
  async startBlock(ownerId:string,target:PracticeBlockTarget,now=new Date()){
    const policyVersion=practiceBlockPolicy(target);
    const open=this.store.studySessions.find(row=>row.ownerId===ownerId&&row.status==="ACTIVE");
    const resumable=open?.policyVersion===policyVersion?open:undefined;
    let items;
    try{items=this.blockItems(ownerId,target,now);}catch(error){if(resumable&&error instanceof TargetedPracticeError&&error.code!=="exam_active")return resumable;throw error;}
    if(resumable)return resumable;
    if(!items.length)return null;
    for(const old of this.store.studySessions.filter(row=>row.ownerId===ownerId&&(row.status==="ACTIVE"||row.status==="PLANNED"))){old.status="ABANDONED";old.endedAt=now;}
    const row={id:crypto.randomUUID(),ownerId,trackId:items[0].trackId!,status:"ACTIVE",budgetMinutes:PRACTICE_BLOCK_MINUTES,items,policyVersion,startedAt:now as Date|null,endedAt:null as Date|null,createdAt:now};this.store.studySessions.push(row);return row;
  }
  async blockHasMore(ownerId:string,target:PracticeBlockTarget,now=new Date()){
    try{return this.blockItems(ownerId,target,now).length>0;}catch(error){if(error instanceof TargetedPracticeError)return false;throw error;}
  }
  private blockItems(ownerId:string,target:PracticeBlockTarget,now:Date){
    const selection=memoryTargetedSelection(this.store,ownerId,target,now);
    const data=memoryAdaptiveChoices(this.store,ownerId,PRACTICE_BLOCK_MINUTES,now,selection);
    const plan=planCandidates(data.choices.map(choice=>choice.candidate),PRACTICE_BLOCK_MINUTES,"FOUNDATION",data.subjectMinutes,undefined,true);
    return capBlockItems(plan.items.map(candidate=>data.choices.find(choice=>choice.candidate.id===candidate.id)!.item));
  }
  async get(ownerId:string,id:string){return this.store.studySessions.find(row=>row.ownerId===ownerId&&row.id===id)??null;}
  async transition(...[ownerId,id,action,now=new Date()]:Parameters<StudySessionRepository["transition"]>){
    const row=this.store.studySessions.find(row=>row.id===id&&row.ownerId===ownerId);if(!row)throw new SessionStateError();
    const target=action==="complete"?"COMPLETED":"ABANDONED";if(row.status===target)return row;
    if(row.status!=="ACTIVE")throw new SessionStateError();
    sessionItemsSchema.parse(row.items);row.status=target;row.endedAt=now;return row;
  }
  async result(ownerId: string, id: string) {
    const session = await this.get(ownerId, id); if (!session) return null;
    const rows = this.store.attempts.filter(row => row.ownerId === ownerId && row.context?.contextKey === id);
    const evidence = this.store.conceptEvidence.filter(fact => fact.ownerId === ownerId && rows.some(row => row.id === fact.attemptId)).map(fact => ({ conceptId: fact.conceptStableId, title: this.store.concepts.find(concept => concept.stableId === fact.conceptStableId)?.title ?? fact.conceptStableId, strength: fact.strength, conditions: fact.conditions }));
    const summary = summarizeSession(session, rows.map(row => ({ key: row.context?.questionId ? JSON.stringify([row.context.questionId, row.context.questionVersion]) : row.questionVersionId ?? row.activityStableId, outcome: row.outcome })), evidence);
    return { session, items: sessionItemsSchema.parse(session.items), attempts: summary.attempts, correct: summary.correct, answered: summary.answered, summary, answers: rows.map(row => toBlockAnswer(row.context, row.outcome)) };
  }
}
