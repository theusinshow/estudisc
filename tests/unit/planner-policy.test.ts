import { expect,it } from "vitest";
import { planCandidates,examPhase,type PlannerCandidate } from "@/features/study-sessions/planner-policy";
it("balances subjects within time while rejecting unavailable, reserved and blocked learning",()=>{
  const base:PlannerCandidate={id:"mat",subjectCode:"MAT",kind:"practice",minutes:15,importance:3,weakness:0.5,dueDays:0,requiredPrerequisitesReady:true,plannerReady:true,reserved:false};
  const candidates=[base,{...base,id:"por",subjectCode:"POR"},{...base,id:"blocked",kind:"learn" as const,requiredPrerequisitesReady:false},{...base,id:"reserved",reserved:true},{...base,id:"draft",plannerReady:false}];
  const plan=planCandidates(candidates,15,"BUILD",{MAT:90,POR:0});expect(plan.items.map(item=>item.id)).toEqual(["por"]);expect(plan.usedMinutes).toBe(15);expect(plan.contentGaps).toEqual(["blocked","draft"]);
  expect(examPhase(new Date("2026-11-20Z"),new Date("2026-11-29Z"))).toBe("EXAM_PREP");
  expect(planCandidates([...candidates].reverse(),15,"BUILD",{MAT:90,POR:0})).toEqual(plan);
});
