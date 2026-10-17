import { describe, expect, it } from "vitest";

import { calculateInitialReviewAt, calculateNextReviewAt, explainDueReview } from "@/features/review/review-policy";

const base = new Date("2026-07-30T12:00:00.000Z");

describe("review policy", () => {
  it("schedules first review for the next day", () => {
    expect(calculateInitialReviewAt(base).toISOString()).toBe("2026-07-31T12:00:00.000Z");
  });

  it("uses deterministic intervals from review quality", () => {
    expect(calculateNextReviewAt({ quality: 2, reviewCount: 0, reviewedAt: base }).toISOString()).toBe(
      "2026-07-31T12:00:00.000Z"
    );
    expect(calculateNextReviewAt({ quality: 4, reviewCount: 0, reviewedAt: base }).toISOString()).toBe(
      "2026-08-06T12:00:00.000Z"
    );
    expect(calculateNextReviewAt({ quality: 5, reviewCount: 0, reviewedAt: base }).toISOString()).toBe(
      "2026-08-13T12:00:00.000Z"
    );
  });

  it("explains whether a scheduled review is due", () => {
    expect(explainDueReview(new Date("2026-07-29T12:00:00.000Z"), base)).toContain("hora de revisar");
    expect(explainDueReview(new Date("2026-08-01T12:00:00.000Z"), base)).toContain("ainda não chegou");
  });
});
