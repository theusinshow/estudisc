import { expect,it } from "vitest";
import { publicationIssues,qaLayers } from "@/features/content-qa/policy";
it("requires all four independent reviews and blocks severe unresolved findings",()=>{
  const reviews=qaLayers.map(layer=>({layer,verdict:"APPROVE" as const,rationale:"Reviewed against original sources",findings:[],reviewerId:"reviewer"}));
  expect(publicationIssues("author",reviews)).toEqual([]);
  expect(publicationIssues("reviewer",reviews)).toHaveLength(4);
  expect(publicationIssues("author",reviews.slice(1))).toEqual(["missing_STRUCTURAL"]);
  expect(publicationIssues("author",[{...reviews[0],findings:[{severity:"CRITICAL",message:"Incorrect key"}]},...reviews.slice(1)])).toEqual(["STRUCTURAL_CRITICAL"]);
});
