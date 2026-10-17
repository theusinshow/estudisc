import { describe, expect, it } from "vitest";

import { resolveContinueTarget } from "@/features/navigation/continue-target";

const lesson = (id: string) => ({ id, title: id, subjectCode: "MAT", order: 1, estimatedMinutes: 8, questionIds: [] });

describe("resolveContinueTarget", () => {
  it("resumes an unfinished lesson before anything else", () => {
    expect(resolveContinueTarget({ next: { lesson: lesson("mat-07"), resume: true }, dueReviewCount: 5 })).toBe("/lessons/mat-07");
  });

  it("sends due reviews before a new lesson", () => {
    expect(resolveContinueTarget({ next: { lesson: lesson("mat-08"), resume: false }, dueReviewCount: 2 })).toBe("/review");
  });

  it("opens the next lesson when nothing is due", () => {
    expect(resolveContinueTarget({ next: { lesson: lesson("mat-08"), resume: false }, dueReviewCount: 0 })).toBe("/lessons/mat-08");
  });

  it("falls back to review, then to Today", () => {
    expect(resolveContinueTarget({ next: null, dueReviewCount: 1 })).toBe("/review");
    expect(resolveContinueTarget({ next: null, dueReviewCount: 0 })).toBe("/");
  });

  it("encodes lesson ids safely", () => {
    expect(resolveContinueTarget({ next: { lesson: lesson("a b/c"), resume: true }, dueReviewCount: 0 })).toBe("/lessons/a%20b%2Fc");
  });
});
