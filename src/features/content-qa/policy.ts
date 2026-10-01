import { z } from "zod";
export const qaLayers = ["STRUCTURAL","FACTUAL","PEDAGOGICAL","IFSC_ALIGNMENT"] as const;
export const qaReviewSchema = z.object({layer:z.enum(qaLayers), verdict:z.enum(["APPROVE","REJECT"]), rationale:z.string().trim().min(20).max(10000), findings:z.array(z.object({severity:z.enum(["INFO","LOW","MEDIUM","HIGH","CRITICAL"]), message:z.string().min(1).max(3000), editorialOverrideReason:z.string().min(20).optional()}).strict()).max(100)}).strict();
export type QaReview = z.infer<typeof qaReviewSchema>;
export function publicationIssues(authorId:string, reviews:readonly (QaReview & {reviewerId:string})[]) {
  const latest = new Map<string,typeof reviews[number]>();
  for (const review of reviews) latest.set(review.layer,review);
  return qaLayers.flatMap(layer=>{
    const review=latest.get(layer);
    if(!review)return [`missing_${layer}`];
    if(review.reviewerId===authorId)return [`self_review_${layer}`];
    if(review.verdict!=="APPROVE")return [`rejected_${layer}`];
    return review.findings.filter(f=>f.severity==="HIGH"||f.severity==="CRITICAL"||f.severity==="MEDIUM"&&!f.editorialOverrideReason).map(f=>`${layer}_${f.severity}`);
  });
}
