import type { Question } from "./contracts";

export type QuestionExposure = Readonly<{ lastSeenAt: Date | null; timesSeen: number }>;
export function canExposeQuestion(question: Question, options: { now: Date; context: "training" | "review" | "assessment"; exposure?: QuestionExposure; authorizedExamId?: string }): boolean {
  if (question.status !== "published") return false;
  const policy = question.exposurePolicy;
  const unlockTime = policy.unlockAt ? new Date(policy.unlockAt).getTime() : Infinity;
  if (policy.reservedForAssessment && options.now.getTime() < unlockTime) {
    if (options.context !== "assessment" || !options.authorizedExamId || options.authorizedExamId !== question.provenance.examId) return false;
  }
  if (options.context === "training" && policy.maximumTrainingExposures !== undefined && (options.exposure?.timesSeen ?? 0) >= policy.maximumTrainingExposures) return false;
  if (options.exposure?.lastSeenAt && options.now.getTime() - options.exposure.lastSeenAt.getTime() < policy.minimumDaysBetween * 86400000) return false;
  return true;
}
