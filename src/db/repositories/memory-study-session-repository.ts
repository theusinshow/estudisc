import { getMemoryStore } from "./memory-store";
import { SessionStateError, type StudySessionRepository } from "./study-session-repository";
import { canExposeQuestion } from "@/features/questions/exposure";
import { questionSchema } from "@/features/questions/contracts";
import { sessionItemsSchema,type SessionItem } from "@/features/study-sessions/contracts";
import { planCandidates,examPhase,type PlannerCandidate } from "@/features/study-sessions/planner-policy";
import { calculateVersionedMastery } from "@/features/mastery/mastery-policy-v2";
export class MemoryStudySessionRepository{
  constructor(private readonly store=getMemoryStore()){}
  async plan(ownerId:string,budgetMinutes:15|30|60){
    const active=this.store.studySessions.find(row=>row.ownerId===ownerId&&row.status==="ACTIVE");if(active)return active;
    for(const row of this.store.studySessions.filter(row=>row.ownerId===ownerId&&row.status==="PLANNED")){row.status="ABANDONED";row.endedAt=new Date();}
    for(const entry of [...this.store.packImports].reverse()){
      const pack=entry.manifest;if(pack?.schema!=="caderno.track.v2")continue;
      const choices:Array<{candidate:PlannerCandidate;item:SessionItem}>=[];const mastery=(id:string)=>calculateVersionedMastery(this.store.conceptEvidence.filter(item=>item.ownerId===ownerId&&item.conceptStableId===id));
      for(const moduleDefinition of pack.track.modules)for(const lesson of moduleDefinition.lessons){
        if(lesson.status!=="published")continue;
        const selected=lesson.activities.filter(activity=>activity.type==="question"&&pack.questions.some(input=>{const question=questionSchema.parse(input);return question.id===activity.questionId&&canExposeQuestion(question,{now:new Date(),context:"training",exposure:this.store.questionExposures.find(item=>item.ownerId===ownerId&&item.questionId===question.id)});})).slice(0,budgetMinutes===15?3:6);
        if(!selected.length)continue;
        const minutes=Math.min(budgetMinutes,Math.max(15,Math.min(30,lesson.estimatedMinutes)));
        const ids=lesson.concepts.map(concept=>concept.id);const levels=ids.map(id=>mastery(id).level);
        const due=this.store.reviewSchedules.filter(item=>item.ownerId===ownerId&&ids.includes(item.conceptStableId)&&item.nextReviewAt.getTime()<=Date.now());
        const required=pack.conceptPrerequisites.filter(edge=>ids.includes(edge.conceptId)&&edge.strength==="required"&&!ids.includes(edge.prerequisiteConceptId));
        const requiredPrerequisitesReady=required.every(edge=>mastery(edge.prerequisiteConceptId).level>=2)&&lesson.prerequisiteConceptIds.every(id=>mastery(id).level>=2);
        const candidate:PlannerCandidate={id:lesson.id,subjectCode:moduleDefinition.subjectCode,kind:due.length?"review":levels.some(level=>level>0)?"practice":"learn",minutes,importance:Math.max(...lesson.concepts.map(concept=>({low:1,medium:2,high:3,critical:4})[concept.importance])),weakness:1-levels.reduce((sum,level)=>sum+level,0)/levels.length/5,dueDays:Math.max(0,...due.map(item=>(Date.now()-item.nextReviewAt.getTime())/86400000)),requiredPrerequisitesReady,plannerReady:true,reserved:false};
        choices.push({candidate,item:{lessonId:lesson.id,version:lesson.version,title:lesson.title,subjectCode:moduleDefinition.subjectCode,minutes,activityIds:selected.map(item=>item.id),questions:selected.map(item=>({id:item.questionId!,version:pack.questions.find(question=>question.id===item.questionId)!.version}))}});
      }
      const subjectMinutes:Record<string,number>={};for(const session of this.store.studySessions.filter(row=>row.ownerId===ownerId&&row.status==="COMPLETED"&&row.endedAt&&row.endedAt.getTime()>=Date.now()-7*86400000))for(const item of sessionItemsSchema.parse(session.items))subjectMinutes[item.subjectCode]=(subjectMinutes[item.subjectCode]??0)+item.minutes;
      const deadline=pack.track.metadata.examDate;const phase=typeof deadline==="string"&&Number.isFinite(Date.parse(deadline))?examPhase(new Date(),new Date(deadline)):"FOUNDATION";
      const plan=planCandidates(choices.map(choice=>choice.candidate),budgetMinutes,phase,subjectMinutes);if(!plan.items.length)continue;
      const row={id:crypto.randomUUID(),ownerId,trackId:pack.track.id,status:"PLANNED",budgetMinutes,items:plan.items.map(candidate=>choices.find(choice=>choice.candidate.id===candidate.id)!.item),policyVersion:plan.policyVersion,startedAt:null,endedAt:null,createdAt:new Date()};this.store.studySessions.push(row);return row;
    }return null;
  }
  async get(ownerId:string,id:string){return this.store.studySessions.find(row=>row.ownerId===ownerId&&row.id===id)??null;}
  async list(ownerId:string){return this.store.studySessions.filter(row=>row.ownerId===ownerId).slice(-15).reverse();}
  async transition(...[ownerId,id,action]:Parameters<StudySessionRepository["transition"]>){
    const row=this.store.studySessions.find(row=>row.id===id&&row.ownerId===ownerId);if(!row)throw new SessionStateError();
    const target=action==="start"?"ACTIVE":action==="complete"?"COMPLETED":"ABANDONED";if(row.status===target)return row;
    if(action==="start"?row.status!=="PLANNED":row.status!=="ACTIVE")throw new SessionStateError();
    if(action==="start"&&this.store.studySessions.some(row=>row.ownerId===ownerId&&row.status==="ACTIVE"))throw new SessionStateError();
    sessionItemsSchema.parse(row.items);row.status=target;if(action==="start")row.startedAt=new Date();else row.endedAt=new Date();return row;
  }
  async result(ownerId:string,id:string){const session=await this.get(ownerId,id);if(!session)return null;const rows=this.store.attempts.filter(row=>row.ownerId===ownerId&&row.context?.contextKey===id);const unique=new Map(rows.map(row=>[row.activityStableId,row]));return {session,items:sessionItemsSchema.parse(session.items),attempts:rows.length,correct:[...unique.values()].filter(row=>row.outcome==="passed").length,answered:unique.size};}
}
