import { randomUUID } from "node:crypto";

import { and, asc, eq, lte, or, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { getDatabase } from "@/db/connection";
import { attempts, conceptEvidence, concepts, mistakes, owners, reviewSchedules, studyEvents } from "@/db/schema";
import { BLIND_SPOT_REASON } from "@/features/review/confidence";
import type * as schema from "@/db/schema";
import {
  calculateNextReviewAt,
  explainDueReview,
  REVIEW_POLICY_VERSION,
  type ReviewQuality
} from "@/features/review/review-policy";

type ReviewDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type DueReview = Readonly<{
  conceptStableId: string;
  conceptTitle: string;
  currentMasteryState: string;
  nextReviewAt: Date;
  reviewCount: number;
  recentQuality: number;
  hasActiveMistake?: boolean;
  /** ADR 0071: an active mistake answered with "Tenho certeza". */
  blindSpot?: boolean;
  reason: string;
}>;

/** ADR 0071: an active mistake whose Attempt was answered with confidence "sure" (a blind spot). */
function activeBlindSpotExists(ownerId: string) {
  return sql<boolean>`exists (select 1 from ${mistakes} join ${attempts} on ${attempts.id} = ${mistakes.attemptId} where ${mistakes.ownerId} = ${ownerId} and ${mistakes.conceptId} = ${reviewSchedules.conceptId} and ${mistakes.status} = 'active' and ${attempts.context}->>'confidence' = 'sure')`;
}

/** True when the owner has an unresolved mistake for the review row's Concept. */
function activeMistakeExists(ownerId: string) {
  return sql<boolean>`exists (select 1 from ${mistakes} where ${mistakes.ownerId} = ${ownerId} and ${mistakes.conceptId} = ${reviewSchedules.conceptId} and ${mistakes.status} = 'active')`;
}

export type CompletedReview = Readonly<{
  conceptStableId: string;
  quality: ReviewQuality;
  nextReviewAt: Date;
  eventType: "review_completed";
}>;

export class ReviewRepository {
  constructor(private readonly db: ReviewDatabase = getDatabase()) {}

  async listDueReviews(ownerId: string, now = new Date()): Promise<DueReview[]> {
    const rows = await this.db
      .select({
        conceptStableId: concepts.stableId,
        conceptTitle: concepts.title,
        currentMasteryState: reviewSchedules.currentMasteryState,
        nextReviewAt: reviewSchedules.nextReviewAt,
        reviewCount: reviewSchedules.reviewCount,
        recentQuality: reviewSchedules.recentQuality,
        hasActiveMistake: activeMistakeExists(ownerId),
        blindSpot: activeBlindSpotExists(ownerId)
      })
      .from(reviewSchedules)
      .innerJoin(concepts, eq(concepts.id, reviewSchedules.conceptId))
      // Pending = scheduled review that is due, or any Concept with an active mistake (one source for Today, /review and Progress).
      .where(and(eq(reviewSchedules.ownerId, ownerId), or(lte(reviewSchedules.nextReviewAt, now), activeMistakeExists(ownerId))))
      // Blind spots lead the queue; then the usual due order.
      .orderBy(sql`${activeBlindSpotExists(ownerId)} desc`, asc(reviewSchedules.nextReviewAt), asc(concepts.title));

    return rows.map(({ hasActiveMistake, blindSpot, ...row }) => ({
      ...row,
      hasActiveMistake: Boolean(hasActiveMistake),
      blindSpot: Boolean(blindSpot),
      reason: blindSpot ? BLIND_SPOT_REASON : hasActiveMistake ? "Você errou uma questão deste conceito. Praticar agora ajuda a fixar." : explainDueReview(row.nextReviewAt, now)
    }));
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
    return this.db.transaction(async (tx) => {
      await tx
        .insert(owners)
        .values({ id: ownerId, displayName: "Local owner" })
        .onConflictDoNothing({ target: owners.id });

      const [concept] = await tx
        .select({ id: concepts.id, stableId: concepts.stableId })
        .from(concepts)
        .where(eq(concepts.stableId, conceptStableId))
        .limit(1);

      if (!concept) {
        return null;
      }
      const [existingReview]=await tx.select().from(reviewSchedules).where(and(eq(reviewSchedules.ownerId,ownerId),eq(reviewSchedules.conceptId,concept.id))).for("update");
      if(existingReview?.policyVersion==="review.v2"){
        // Self-rating is useful reflection, but does not prove successful retrieval.
        const nextReviewAt=quality<=2?new Date(reviewedAt.getTime()+86400000):existingReview.nextReviewAt;
        await tx.update(reviewSchedules).set({nextReviewAt,updatedAt:reviewedAt}).where(eq(reviewSchedules.id,existingReview.id));
        await tx.insert(studyEvents).values({ownerId,type:"review_reflection",entityType:"concept",entityId:conceptStableId,payload:{quality,policyVersion:"review.v2"}});
        return {conceptStableId,quality,nextReviewAt,eventType:"review_completed"};
      }

      const nextReviewAt = calculateNextReviewAt({
        quality,
        reviewCount: 1,
        reviewedAt
      });
      const sourceId = randomUUID();
      const outcome = quality >= 3 ? "passed" : "failed";

      await tx.insert(conceptEvidence).values({
        ownerId,
        conceptId: concept.id,
        type: "delayed_review_result",
        strength: quality >= 3 ? 3 : 1,
        sourceType: "review_session",
        sourceId,
        conditions: {
          conceptStableId: concept.stableId,
          outcome,
          policyVersion: REVIEW_POLICY_VERSION,
          quality
        }
      });

      await tx
        .insert(reviewSchedules)
        .values({
          ownerId,
          conceptId: concept.id,
          currentMasteryState: outcome === "passed" ? "strong" : "practicing",
          lastReviewedAt: reviewedAt,
          nextReviewAt,
          reviewCount: 1,
          recentQuality: quality,
          policyVersion: REVIEW_POLICY_VERSION
        })
        .onConflictDoUpdate({
          target: [reviewSchedules.ownerId, reviewSchedules.conceptId],
          set: {
            currentMasteryState: outcome === "passed" ? "strong" : "practicing",
            lastReviewedAt: reviewedAt,
            nextReviewAt,
            reviewCount: sql`${reviewSchedules.reviewCount} + 1`,
            recentQuality: quality,
            policyVersion: REVIEW_POLICY_VERSION,
            updatedAt: sql`now()`
          }
        });

      await tx.insert(studyEvents).values({
        ownerId,
        type: "review_completed",
        entityType: "concept",
        entityId: concept.stableId,
        payload: {
          conceptStableId: concept.stableId,
          nextReviewAt: nextReviewAt.toISOString(),
          outcome,
          quality
        }
      });

      return {
        conceptStableId: concept.stableId,
        quality,
        nextReviewAt,
        eventType: "review_completed"
      };
    });
  }
}
