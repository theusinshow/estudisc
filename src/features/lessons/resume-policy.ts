import { sessionItemsSchema } from "@/features/study-sessions/contracts";
import type { ResumeData, ResumeScope } from "./resume-contracts";
import { validInteractionState, type InteractionSource } from "./interaction-policy";

export class ResumeUnavailableError extends Error { constructor() { super("Lesson resume unavailable"); } }
export class ResumeConflictError extends Error { constructor() { super("A newer lesson resume exists"); } }
export type ResumeMember = { activityId: string; questionId: string; questionVersion: number; questionType?: string };
type ResumeSession = { ownerId: string; status: string; trackId: string; items: unknown };
export function draftResponseMatches(type: string, response: unknown) {
  if (response === null) return true;
  if (type === "multiple_choice" || type === "numeric") return typeof response === "string";
  if (type === "ordering") return Array.isArray(response);
  return typeof response === "object" && !Array.isArray(response);
}
export function sessionResumeItem(scope: ResumeScope, session: ResumeSession | undefined, ownerId: string) {
  if (!scope.sessionId) return undefined;
  if (!session || session.ownerId !== ownerId || session.status !== "ACTIVE") throw new ResumeUnavailableError();
  const item = sessionItemsSchema.parse(session.items).find(item => item.lessonId === scope.lessonId && item.version === scope.version && (item.trackId ?? session.trackId) === scope.trackId);
  if (!item) throw new ResumeUnavailableError();
  return item;
}
export function sessionResumeMembers(scope: ResumeScope, session: ResumeSession | undefined, ownerId: string, all: ResumeMember[]) {
  const item = sessionResumeItem(scope, session, ownerId);
  if (!item) return all;
  return all.filter(ref => item.activityIds.includes(ref.activityId) && item.questions.some(question => question.id === ref.questionId && question.version === ref.questionVersion));
}
export function assertResumeInteractions(data: ResumeData, sources: readonly InteractionSource[]) {
  if (data.interactions?.some(entry => !sources.some(source => validInteractionState(source, entry)))) throw new ResumeUnavailableError();
}
export function retainInteractions(input: ResumeData, current: ResumeData | undefined): ResumeData {
  return input.interactions === undefined && current?.interactions ? { ...input, interactions: current.interactions } : input;
}
export function resumeReply(data: ResumeData, input: ResumeData): ResumeData {
  const reply = { ...data }; if (input.interactions === undefined) delete reply.interactions;
  return reply;
}
export function assertResumeDrafts(data: ResumeData, members: ResumeMember[]) {
  if (data.drafts.some(draft => !members.some(ref => ref.activityId === draft.activityId && ref.questionId === draft.questionId && ref.questionVersion === draft.questionVersion && (!ref.questionType || draftResponseMatches(ref.questionType, draft.response))))) throw new ResumeUnavailableError();
}
