import { expect,it } from "vitest";
import { calculateConceptMasteryV2,evidenceStrengthV2,type EvidenceV2Input } from "@/features/mastery/mastery-policy-v2";
import { scheduleReviewV2,reviewsWithinBudget } from "@/features/review/review-policy-v2";
const start=new Date("2026-10-01T12:00:00Z");
it("requires independent, varied, delayed and applied evidence; time changes retention only",()=>{
  const input:EvidenceV2Input={correct:true,difficulty:"applied",mode:"review",hintLevel:0,solutionRevealed:false,questionId:"q0",delayedRetrieval:true,transfer:true,createdAt:start};
  expect(evidenceStrengthV2(input)).toBeGreaterThan(evidenceStrengthV2({...input,hintLevel:3}));
  const facts=Array.from({length:6},(_,index)=>({type:"question_result",strength:100,createdAt:new Date(start.getTime()+Math.floor(index/2)*86400000),conditions:{...input,policyVersion:"mastery.v2",questionId:`q${index%3}`,outcome:"passed"}}));
  expect(calculateConceptMasteryV2(facts.slice(0,1),start).state).toBe("understood");
  expect(calculateConceptMasteryV2(facts,start).state).toBe("mastered");
  const later=calculateConceptMasteryV2(facts,new Date("2026-12-01T12:00:00Z"));expect(later.state).toBe("mastered");expect(later.reviewDue).toBe(true);
  expect(calculateConceptMasteryV2(facts,start)).toEqual(calculateConceptMasteryV2([...facts].reverse(),start));
  expect(calculateConceptMasteryV2(facts.map(item=>({...item,conditions:{...item.conditions,hintLevel:3}})),start).state).not.toBe("mastered");
});
it("uses adaptive 1/3/7/14/30 reviews and a time budget",()=>{
  expect(scheduleReviewV2({correct:true,independent:true,stage:0,reviewedAt:start}).stabilityDays).toBe(3);
  expect(scheduleReviewV2({correct:false,independent:true,stage:4,reviewedAt:start}).stabilityDays).toBe(1);
  expect(scheduleReviewV2({correct:true,independent:true,stage:3,reviewedAt:start}).stabilityDays).toBe(30);
  expect(reviewsWithinBudget([{minutes:5,nextReviewAt:start},{minutes:10,nextReviewAt:start}],5)).toHaveLength(1);
});
