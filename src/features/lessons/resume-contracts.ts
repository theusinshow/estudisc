import { z } from "zod";

const id = z.string().trim().min(1).max(160);
export const resumeScopeSchema = z.object({ trackId: id, lessonId: id, version: z.number().int().positive(), sessionId: z.uuid().optional() }).strict();
const responseSchema = z.union([z.string().max(2000), z.array(id).max(100), z.record(id, id), z.null()]);
export const resumeDraftSchema = z.object({ activityId: id, questionId: id, questionVersion: z.number().int().positive(), response: responseSchema, submissionKey: z.uuid(), baseAttemptId: z.uuid().nullable() }).strict();
export const resumeDataSchema = z.object({ stepId: id.nullable(), completed: z.boolean(), showAll: z.boolean(), elapsedSeconds: z.number().int().min(0).max(604800), drafts: z.array(resumeDraftSchema).max(50) }).strict().superRefine((data, context) => {
  if (new Set(data.drafts.map(draft => draft.activityId)).size !== data.drafts.length) context.addIssue({ code: "custom", message: "Duplicate draft activity" });
  if (new TextEncoder().encode(JSON.stringify(data)).length > 48000) context.addIssue({ code: "custom", message: "Resume snapshot is too large" });
});
export const saveResumeSchema = z.object({ scope: resumeScopeSchema, revision: z.number().int().nonnegative(), mutationId: z.uuid(), data: resumeDataSchema }).strict();
export type ResumeScope = z.infer<typeof resumeScopeSchema>;
export type ResumeData = z.infer<typeof resumeDataSchema>;
export type ResumeDraft = z.infer<typeof resumeDraftSchema>;
export type SaveResume = z.infer<typeof saveResumeSchema>;
export type ResumeSnapshot = { revision: number; data: ResumeData; updatedAt: string };
export const resumeSnapshotSchema = z.object({ revision: z.number().int().positive(), data: resumeDataSchema, updatedAt: z.iso.datetime() }).strict();
export const emptyResume = (): ResumeData => ({ stepId: null, completed: false, showAll: false, elapsedSeconds: 0, drafts: [] });
export const resumeIdentity = (ownerId: string, scope: ResumeScope) => JSON.stringify([ownerId, scope.sessionId ?? "lesson", scope.trackId, scope.lessonId, scope.version]);

/** Pending/old drafts never replace a newer canonical submission. */
export function usableDraft(draft: ResumeDraft | undefined, latest?: { attemptId: string; submissionKey: string }) {
  if (!draft) return undefined;
  if (latest ? draft.baseAttemptId !== latest.attemptId || draft.submissionKey === latest.submissionKey : draft.baseAttemptId !== null) return undefined;
  return draft;
}

export function restoredStep(stepIds: readonly string[], saved: string | null, completed = false) {
  if (completed) return { index: stepIds.length, stale: false };
  if (saved === null) return { index: 0, stale: false };
  const index = stepIds.indexOf(saved);
  return { index: index < 0 ? 0 : index, stale: index < 0 };
}
