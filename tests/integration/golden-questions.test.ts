import { expect,it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { MemoryTrackImportRepository,getMemoryStore } from "@/db/repositories/memory-store";
import { MemoryQuestionStudyRepository } from "@/db/repositories/memory-question-study-repository";
import { questionSchema } from "@/features/questions/contracts";
it("completes every shared Question in the four Golden Lessons with real evaluators",async()=>{
  const fixture=JSON.parse(JSON.stringify(source));fixture.questions.forEach((question:{status:string})=>question.status="published");fixture.track.modules.forEach((moduleDefinition:{lessons:Array<{status:string}>})=>moduleDefinition.lessons.forEach(lesson=>lesson.status="published"));
  expect((await importTrackPack(fixture,new MemoryTrackImportRepository())).status).toBe("imported");
  const repo=new MemoryQuestionStudyRepository();let count=0;
  for(const moduleDefinition of fixture.track.modules)for(const lesson of moduleDefinition.lessons)for(const activity of lesson.activities){
    const question=questionSchema.parse(fixture.questions.find((question:{id:string})=>question.id===activity.questionId));
    await repo.view("golden-test-owner",activity.id,question.id,question.version);
    const answer=question.answer;const response=answer.kind==="numeric"?String(answer.value):answer.kind==="multiple_choice"?answer.choiceId:answer.kind==="ordering"?answer.orderedIds:answer.kind==="matching"?answer.pairs:answer.assignments;
    expect(await repo.interact("golden-test-owner",activity.id,{questionId:question.id,questionVersion:question.version,response,action:"submit",submissionKey:crypto.randomUUID()})).toMatchObject({correct:true});count++;
  }
  expect(getMemoryStore().attempts.filter(attempt=>attempt.ownerId==="golden-test-owner")).toHaveLength(count);
});
