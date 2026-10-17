export const REVIEW_POLICY_VERSION = "review.v1";

const dayMs = 24 * 60 * 60 * 1000;

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export function calculateInitialReviewAt(now: Date) {
  return addDays(now, 1);
}

export function calculateNextReviewAt({
  quality,
  reviewedAt
}: Readonly<{
  quality: ReviewQuality;
  reviewCount: number;
  reviewedAt: Date;
}>) {
  if (quality <= 2) {
    return addDays(reviewedAt, 1);
  }

  if (quality === 3) {
    return addDays(reviewedAt, 3);
  }

  if (quality === 4) {
    return addDays(reviewedAt, 7);
  }

  return addDays(reviewedAt, 14);
}

export function explainDueReview(nextReviewAt: Date, now: Date) {
  if (nextReviewAt.getTime() <= now.getTime()) {
    return "Está na hora de revisar este conceito.";
  }

  return "A revisão deste conceito ainda não chegou.";
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayMs);
}
