import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { questionSchema } from "@/features/questions/contracts";
export function reviewMistakeFixture(){
  const pack=trackPackV2Schema.parse(source);pack.packId="estudisc.review-mistake.fixture";pack.track.id="review-mistake-fixture";
  for(const m of pack.track.modules)for(const l of m.lessons){l.status="draft";l.id+="-review-loop";for(const a of l.activities)a.id+="-review-loop";}
  const base=pack.questions.find(q=>q.subjectCode==="MAT")!;
  const lesson=pack.track.modules.find(m=>m.subjectCode==="MAT")!.lessons[0];
  const conceptId=lesson.concepts[0].id;
  const created=[5,7].map((answer,index)=>questionSchema.parse({...base,id:`review-loop-q${index+1}`,conceptIds:[conceptId],primaryConceptId:conceptId,type:"numeric",difficulty:"foundation",choices:undefined,answer:{kind:"numeric",value:answer,tolerance:0},stem:index===0?"Quanto é 2 + 3 nesta fixture?":"Quanto é 3 + 4 nesta fixture?",explanation:index===0?"2 + 3 = 5.":"3 + 4 = 7.",status:"published",exposurePolicy:{...base.exposurePolicy,minimumDaysBetween:0}}));
  pack.questions.push(...created);lesson.id="REVIEW-MISTAKE-PILOT";lesson.title="Fixture de recuperação";lesson.status="published";lesson.prerequisiteConceptIds=[];lesson.exitTicketQuestionIds=created.map(q=>q.id);
  lesson.blocks=[{id:"review-loop-intro",type:"text",schemaVersion:1,conceptIds:[conceptId],payload:{type:"text",content:"Fixture local para registrar uma tentativa e praticar outro item."}}];
  lesson.activities=created.map((q,index)=>({id:`review-loop-a${index+1}`,type:"question",conceptIds:[conceptId],prompt:q.stem,questionId:q.id,config:{questionId:q.id,questionVersion:q.version,hints:["Uma dica da fixture."]}}));
  return trackPackV2Schema.parse(pack);
}
