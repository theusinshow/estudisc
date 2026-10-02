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

type ProvenanceSource = Readonly<{ id: string; type: string; metadata?: Record<string, unknown> }>;
type AuthoredQuestion = Readonly<{ provenance: Readonly<{ type: string; generationRunId?: string; examId?: string }> }>;
type AuthoredLesson = Readonly<{ sourceIds: readonly string[] }>;

/** ADR 0033: a release is attributed to whoever wrote the content, falling back to the importer. */
export function releaseAuthor(
  target: Readonly<{ kind: "question"; question: AuthoredQuestion } | { kind: "lesson"; lesson: AuthoredLesson } | { kind: "curriculum" }>,
  sources: readonly ProvenanceSource[],
  importerId: string
) {
  if (target.kind === "question") {
    const { provenance } = target.question;
    if (provenance.type === "generated" && provenance.generationRunId) return `ai:${provenance.generationRunId}`;
    if (provenance.type === "official_exam" && provenance.examId) return `exam:${provenance.examId}`;
  }
  if (target.kind === "lesson") {
    const runId = sources.find(source => target.lesson.sourceIds.includes(source.id) && source.type === "ai_generated" && typeof source.metadata?.authorRunId === "string")?.metadata?.authorRunId;
    if (typeof runId === "string") return `ai:${runId}`;
  }
  return importerId;
}
