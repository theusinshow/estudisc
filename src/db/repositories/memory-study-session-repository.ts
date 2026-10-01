import { getMemoryStore } from "./memory-store";
import { SessionStateError, type StudySessionRepository } from "./study-session-repository";
import { canExposeQuestion } from "@/features/questions/exposure";
import { questionSchema } from "@/features/questions/contracts";
import { sessionItemsSchema,STUDY_SESSION_POLICY } from "@/features/study-sessions/contracts";
export class MemoryStudySessionRepository{
  constructor(private readonly store=getMemoryStore()){}
  async plan(ownerId:string,budgetMinutes:15|30|60){
    const active=this.store.studySessions.find(row=>row.ownerId===ownerId&&row.status==="ACTIVE");if(active)return active;
    for(const row of this.store.studySessions.filter(row=>row.ownerId===ownerId&&row.status==="PLANNED")){row.status="ABANDONED";row.endedAt=new Date();}
    for(const entry of [...this.store.packImports].reverse()){
      const pack=entry.manifest;if(pack?.schema!=="caderno.track.v2")continue;
      for(const moduleDefinition of pack.track.modules)for(const lesson of moduleDefinition.lessons){
        if(lesson.status!=="published")continue;
        const selected=lesson.activities.filter(activity=>activity.type==="question"&&pack.questions.some(input=>{const question=questionSchema.parse(input);return question.id===activity.questionId&&canExposeQuestion(question,{now:new Date(),context:"training",exposure:this.store.questionExposures.find(item=>item.ownerId===ownerId&&item.questionId===question.id)});})).slice(0,budgetMinutes===15?3:6);
        if(!selected.length)continue;
        const row={id:crypto.randomUUID(),ownerId,trackId:pack.track.id,status:"PLANNED",budgetMinutes,items:[{lessonId:lesson.id,version:lesson.version,title:lesson.title,subjectCode:moduleDefinition.subjectCode,minutes:Math.min(budgetMinutes,lesson.estimatedMinutes),activityIds:selected.map(item=>item.id),questions:selected.map(item=>({id:item.questionId!,version:pack.questions.find(question=>question.id===item.questionId)!.version}))}],policyVersion:STUDY_SESSION_POLICY,startedAt:null,endedAt:null,createdAt:new Date()};this.store.studySessions.push(row);return row;
      }
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
