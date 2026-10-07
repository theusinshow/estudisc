import { expect, it } from "vitest";
import { emptyResume, resumeDataSchema, resumeIdentity, restoredStep, usableDraft } from "@/features/lessons/resume-contracts";
import { draftResponseMatches } from "@/features/lessons/resume-policy";

it("separates owner, context, track and version without concatenation collisions", () => {
  const scope = { trackId: "track", lessonId: "lesson", version: 1 };
  expect(new Set([resumeIdentity("a", scope), resumeIdentity("b", scope), resumeIdentity("a", { ...scope, version: 2 }), resumeIdentity("a", { ...scope, sessionId: crypto.randomUUID() })]).size).toBe(4);
  expect(resumeIdentity("a:b", { ...scope, trackId: "c" })).not.toBe(resumeIdentity("a", { ...scope, trackId: "b:c" }));
});
it("restores stable step IDs and recovers removed steps without claiming completion", () => {
  expect(restoredStep(["one", "two"], "two")).toEqual({ index: 1, stale: false });
  expect(restoredStep(["one", "two"], "missing")).toEqual({ index: 0, stale: true });
  expect(restoredStep(["one"], null, true)).toEqual({ index: 1, stale: false });
  expect(restoredStep(["completed"], "completed")).toEqual({ index: 0, stale: false });
});
it("does not let an old or already submitted draft overwrite canonical answers", () => {
  const latest = { attemptId: crypto.randomUUID(), submissionKey: crypto.randomUUID() };
  const draft = { activityId: "activity", questionId: "question", questionVersion: 1, response: "12", submissionKey: crypto.randomUUID(), baseAttemptId: null };
  expect(usableDraft(draft)).toEqual(draft);
  expect(usableDraft(draft, latest)).toBeUndefined();
  const successor = { ...draft, baseAttemptId: latest.attemptId };
  expect(usableDraft(successor, latest)).toEqual(successor);
  expect(usableDraft({ ...successor, submissionKey: latest.submissionKey }, latest)).toBeUndefined();
});
it("bounds user state and rejects duplicates or canonical grading payloads", () => {
  expect(draftResponseMatches("ordering", "wrong-shape")).toBe(false);
  expect(draftResponseMatches("matching", ["wrong-shape"])).toBe(false);
  expect(resumeDataSchema.parse(emptyResume())).toEqual(emptyResume());
  const draft = { activityId: "activity", questionId: "question", questionVersion: 1, response: "1", submissionKey: crypto.randomUUID(), baseAttemptId: null };
  expect(() => resumeDataSchema.parse({ ...emptyResume(), drafts: [draft, draft] })).toThrow();
  expect(() => resumeDataSchema.parse({ ...emptyResume(), mastery: 5 })).toThrow();
  expect(() => resumeDataSchema.parse({ ...emptyResume(), drafts: [{ ...draft, response: "a".repeat(2001) }] })).toThrow();
});
