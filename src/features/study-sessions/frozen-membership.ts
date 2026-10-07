import { sessionItemsSchema } from "./contracts";

export function frozenMember(items: unknown, anchorTrackId: string, member: {
  lessonId: string; version: number; trackId: string; activityId: string; questionId: string; questionVersion: number;
}) {
  const parsed = sessionItemsSchema.safeParse(items);
  return parsed.success ? parsed.data.find(item => item.lessonId === member.lessonId && item.version === member.version &&
    (item.trackId ?? anchorTrackId) === member.trackId && item.activityIds.includes(member.activityId) &&
    item.questions.some(question => question.id === member.questionId && question.version === member.questionVersion)) : undefined;
}

export function planningActivityKey(trackId: string, lessonId: string, version: number, activityId: string) {
  return JSON.stringify([trackId, lessonId, version, activityId]);
}
