import { expect, it } from "vitest";
import { frozenMember, planningActivityKey } from "@/features/study-sessions/frozen-membership";

it("pins track/version/activity/question and supports a legacy anchor without cross-track substitution", () => {
  const item = { lessonId: "lesson", version: 1, title: "Aula", subjectCode: "MAT", minutes: 8, activityIds: ["a"], questions: [{ id: "q", version: 1 }], trackId: "track-b" };
  const member = { lessonId: "lesson", version: 1, trackId: "track-b", activityId: "a", questionId: "q", questionVersion: 1 };
  expect(frozenMember([item], "track-a", member)).toBeTruthy();
  expect(frozenMember([item], "track-a", { ...member, trackId: "track-a" })).toBeUndefined();
  expect(frozenMember([item], "track-a", { ...member, version: 2 })).toBeUndefined();
  const legacy = { ...item }; delete (legacy as { trackId?: string }).trackId;
  expect(frozenMember([legacy], "track-b", member)).toBeTruthy();
  expect(planningActivityKey("a:b", "c", 1, "d")).not.toBe(planningActivityKey("a", "b:c", 1, "d"));
});
