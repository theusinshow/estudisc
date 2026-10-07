import { sessionItemsSchema } from "@/features/study-sessions/contracts";
import type { ResumeData, ResumeScope } from "./resume-contracts";

export class ResumeUnavailableError extends Error { constructor() { super("Lesson resume unavailable"); } }
export class ResumeConflictError extends Error { constructor() { super("A newer lesson resume exists"); } }
export type ResumeMember = { activityId: string; questionId: string; questionVersion: number; questionType?: string };
export function draftResponseMatches(type: string, response: unknown) {
  if (response === null) return true;
  if (type === "multiple_choice" || type === "numeric") return typeof response === "string";
  if (type === "ordering") return Array.isArray(response);
  return typeof response === "object" && !Array.isArray(response);
}
export function sessionResumeMembers(scope: ResumeScope, session: { ownerId: string; status: string; trackId: string; items: unknown } | undefined, ownerId: string, all: ResumeMember[]) {
  if (!scope.sessionId) return all;
  if (!session || session.ownerId !== ownerId || session.status !== "ACTIVE") throw new ResumeUnavailableError();
  const item = sessionItemsSchema.parse(session.items).find(item => item.lessonId === scope.lessonId && item.version === scope.version && (item.trackId ?? session.trackId) === scope.trackId);
  if (!item) throw new ResumeUnavailableError();
  return all.filter(ref => item.activityIds.includes(ref.activityId) && item.questions.some(question => question.id === ref.questionId && question.version === ref.questionVersion));
}
export function assertResumeDrafts(data: ResumeData, members: ResumeMember[]) {
  if (data.drafts.some(draft => !members.some(ref => ref.activityId === draft.activityId && ref.questionId === draft.questionId && ref.questionVersion === draft.questionVersion && (!ref.questionType || draftResponseMatches(ref.questionType, draft.response))))) throw new ResumeUnavailableError();
}
