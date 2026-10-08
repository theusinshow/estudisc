import { expect,it } from "vitest";
import { summarizeAssessmentConcepts } from "@/features/assessments/result-summary";
it("reports only actual scored outcomes per distinct Concept without counting annulled items or claiming mastery",()=>{
  const input=[{outcome:"passed",conceptIds:["a","a","b"]},{outcome:"failed",conceptIds:["a"]},{outcome:"annulled",conceptIds:["a","b"]}],before=structuredClone(input);
  expect(summarizeAssessmentConcepts(input)).toEqual([{conceptId:"a",correct:1,scored:2,annulled:1},{conceptId:"b",correct:1,scored:1,annulled:1}]);expect(input).toEqual(before);
});
