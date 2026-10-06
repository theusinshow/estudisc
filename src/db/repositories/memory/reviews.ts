import type { CompletedReview, DueReview } from "@/db/repositories/review-repository";
import type { MistakeRecord } from "@/db/repositories/mistake-repository";
import { calculateNextReviewAt, explainDueReview, REVIEW_POLICY_VERSION, type ReviewQuality } from "@/features/review/review-policy";
import { getMemoryStore } from './store';


export class MemoryReviewRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async listDueReviews(ownerId: string, now = new Date()): Promise<DueReview[]> {
    return this.store.reviewSchedules
      .filter((schedule) => schedule.ownerId === ownerId && schedule.nextReviewAt.getTime() <= now.getTime())
      .sort((left, right) => left.nextReviewAt.getTime() - right.nextReviewAt.getTime())
      .map((schedule) => {
        const concept = this.store.concepts.find((entry) => entry.stableId === schedule.conceptStableId);

        return {
          conceptStableId: schedule.conceptStableId,
          conceptTitle: concept?.title ?? schedule.conceptStableId,
          currentMasteryState: schedule.currentMasteryState,
          nextReviewAt: schedule.nextReviewAt,
          reviewCount: schedule.reviewCount,
          recentQuality: schedule.recentQuality,
          reason: explainDueReview(schedule.nextReviewAt, now)
        };
      });
  }

  async completeReview({
    ownerId,
    conceptStableId,
    quality,
    reviewedAt = new Date()
  }: Readonly<{
    ownerId: string;
    conceptStableId: string;
    quality: ReviewQuality;
    reviewedAt?: Date;
  }>): Promise<CompletedReview | null> {
    const concept = this.store.concepts.find((entry) => entry.stableId === conceptStableId);

    if (!concept) {
      return null;
    }

    const prior=this.store.reviewSchedules.find(schedule=>schedule.ownerId===ownerId&&schedule.conceptStableId===conceptStableId);
    if(prior?.policyVersion==="review.v2"){
      if(quality<=2)prior.nextReviewAt=new Date(reviewedAt.getTime()+86400000);
      this.store.events.push({ownerId,id:crypto.randomUUID(),type:"review_reflection",entityType:"concept",entityId:conceptStableId,payload:{quality,policyVersion:"review.v2"},occurredAt:reviewedAt});
      return {conceptStableId,quality,nextReviewAt:prior.nextReviewAt,eventType:"review_completed"};
    }

    const outcome = quality >= 3 ? "passed" : "failed";
    const nextReviewAt = calculateNextReviewAt({ quality, reviewCount: 1, reviewedAt });
    const sourceId = `memory-review-${this.store.conceptEvidence.length + 1}`;

    this.store.conceptEvidence.push({
      id: `memory-evidence-${this.store.conceptEvidence.length + 1}`,
      ownerId,
      conceptStableId,
      attemptId: null,
      type: "delayed_review_result",
      strength: quality >= 3 ? 3 : 1,
      sourceType: "review_session",
      sourceId,
      conditions: {
        conceptStableId,
        outcome,
        policyVersion: REVIEW_POLICY_VERSION,
        quality
      },
      createdAt: reviewedAt
    });

    const existing = this.store.reviewSchedules.find(
      (schedule) => schedule.ownerId === ownerId && schedule.conceptStableId === conceptStableId
    );

    if (existing) {
      existing.currentMasteryState = outcome === "passed" ? "strong" : "practicing";
      existing.lastReviewedAt = reviewedAt;
      existing.nextReviewAt = nextReviewAt;
      existing.reviewCount += 1;
      existing.recentQuality = quality;
      existing.policyVersion = REVIEW_POLICY_VERSION;
      existing.updatedAt = reviewedAt;
    } else {
      this.store.reviewSchedules.push({
        ownerId,
        conceptStableId,
        currentMasteryState: outcome === "passed" ? "strong" : "practicing",
        lastReviewedAt: reviewedAt,
        nextReviewAt,
        reviewCount: 1,
        recentQuality: quality,
        policyVersion: REVIEW_POLICY_VERSION,
        updatedAt: reviewedAt
      });
    }

    this.store.events.push({
      ownerId,
      id: `memory-event-${this.store.events.length + 1}`,
      type: "review_completed",
      entityType: "concept",
      entityId: conceptStableId,
      payload: {
        conceptStableId,
        nextReviewAt: nextReviewAt.toISOString(),
        outcome,
        quality
      },
      occurredAt: reviewedAt
    });

    return {
      conceptStableId,
      quality,
      nextReviewAt,
      eventType: "review_completed"
    };
  }
}

export class MemoryMistakeRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async listMistakes(ownerId: string): Promise<MistakeRecord[]> {
    return this.store.mistakes
      .filter((mistake) => mistake.ownerId === ownerId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((mistake) => {
        const concept = this.store.concepts.find((entry) => entry.stableId === mistake.conceptStableId);

        return {
          id: mistake.id,
          conceptStableId: mistake.conceptStableId,
          conceptTitle: concept?.title ?? mistake.conceptStableId,
          attemptId: mistake.attemptId,
          category: mistake.category,
          summary: mistake.summary,
          status: mistake.status,
          createdAt: mistake.createdAt,
          resolvedAt: mistake.resolvedAt
        };
      });
  }
}
