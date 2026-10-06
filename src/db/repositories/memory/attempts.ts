import type { CodeActivityRecord, LatestAttemptFeedback, RecordedSubmission } from "@/db/repositories/activity-attempt-repository";
import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";
import { categorizeSubmissionMistake } from "@/features/mistakes/mistake-categorization";
import { calculateInitialReviewAt, REVIEW_POLICY_VERSION } from "@/features/review/review-policy";
import type { JavaScriptEvaluationResult } from "@/runtime/javascript/api";
import { getMemoryStore, parseActivityConceptStableIds, getEvidenceTypeForActivityType } from './store';


export class MemoryActivityAttemptRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async getCodeActivity(stableId: string): Promise<CodeActivityRecord | null> {
    const activity = this.store.activities.find((entry) => entry.stableId === stableId);

    if (!activity) {
      return null;
    }

    return {
      id: activity.stableId,
      stableId: activity.stableId,
      lessonId: activity.lessonStableId,
      trackId: activity.trackStableId,
      type: activity.type,
      prompt: activity.prompt,
      config: activity.config,
      evaluatorVersion: activity.evaluatorVersion
    };
  }

  async countAttemptsForActivity(ownerId: string, activityId: string): Promise<number> {
    return this.store.attempts.filter((attempt) => attempt.ownerId === ownerId && attempt.activityStableId === activityId)
      .length;
  }

  async countStudyEvents(ownerId: string): Promise<number> {
    return this.store.events.filter((event) => event.payload && event.id && event.type && ownerId).length;
  }

  async getLatestAttemptFeedback(ownerId: string, activityId: string): Promise<LatestAttemptFeedback | null> {
    const attempt = this.store.attempts
      .filter((entry) => entry.ownerId === ownerId && entry.activityStableId === activityId)
      .sort((left, right) => right.attemptNumber - left.attemptNumber)[0];

    if (!attempt) {
      return null;
    }

    return {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      outcome: attempt.outcome==="annulled"?"failed":attempt.outcome,
      source: attempt.source,
      execution: attempt.output,
      tests: attempt.tests,
      createdAt: attempt.createdAt
    };
  }

  async recordSubmission({
    ownerId,
    activity,
    source,
    evaluation
  }: Readonly<{
    ownerId: string;
    activity: CodeActivityRecord;
    source: string;
    evaluation: JavaScriptEvaluationResult;
  }>): Promise<RecordedSubmission> {
    const attemptNumber = (await this.countAttemptsForActivity(ownerId, activity.id)) + 1;
    const attemptId = `memory-attempt-${attemptNumber}`;

    this.store.attempts.push({
      id: attemptId,
      ownerId,
      activityStableId: activity.id,
      attemptNumber,
      outcome: evaluation.outcome,
      source,
      output: evaluation.execution,
      tests: evaluation.tests,
      createdAt: new Date()
    });

    for (const conceptStableId of parseActivityConceptStableIds(activity.config)) {
      const now = new Date();
      const categorizedMistake = categorizeSubmissionMistake(evaluation);
      this.store.conceptEvidence.push({
        id: `memory-evidence-${this.store.conceptEvidence.length + 1}`,
        ownerId,
        conceptStableId,
        attemptId,
        type: getEvidenceTypeForActivityType(activity.type),
        strength: evaluation.outcome === "passed" ? 2 : 1,
        sourceType: "activity_attempt",
        sourceId: attemptId,
        conditions: {
          activityStableId: activity.stableId,
          activityType: activity.type,
          attemptNumber,
          conceptStableId,
          evaluatorVersion: activity.evaluatorVersion,
          outcome: evaluation.outcome,
          testCount: evaluation.tests.length
        },
        createdAt: new Date()
      });

      if (
        !this.store.reviewSchedules.some(
          (schedule) => schedule.ownerId === ownerId && schedule.conceptStableId === conceptStableId
        )
      ) {
        this.store.reviewSchedules.push({
          ownerId,
          conceptStableId,
          currentMasteryState: evaluation.outcome === "passed" ? "understood" : "introduced",
          lastReviewedAt: null,
          nextReviewAt: calculateInitialReviewAt(now),
          reviewCount: 0,
          recentQuality: evaluation.outcome === "passed" ? 3 : 1,
          policyVersion: REVIEW_POLICY_VERSION,
          updatedAt: now
        });
      }

      if (categorizedMistake) {
        this.store.mistakes.push({
          id: `memory-mistake-${this.store.mistakes.length + 1}`,
          ownerId,
          conceptStableId,
          attemptId,
          category: categorizedMistake.category,
          summary: categorizedMistake.summary,
          status: "active",
          createdAt: now,
          resolvedAt: null
        });
      } else {
        for (const mistake of this.store.mistakes.filter(
          (entry) =>
            entry.ownerId === ownerId && entry.conceptStableId === conceptStableId && entry.status === "active"
        )) {
          mistake.status = "resolved";
          mistake.resolvedAt = now;
        }
      }
    }

    if (evaluation.outcome === "passed") {
      const previousPassedAttempts = this.store.attempts.filter(
        (attempt) =>
          attempt.ownerId === ownerId &&
          attempt.activityStableId === activity.id &&
          attempt.outcome === "passed" &&
          attempt.id !== attemptId
      );

      if (previousPassedAttempts.length === 0) {
        this.store.xpTransactions.push({
          id: `memory-xp-${this.store.xpTransactions.length + 1}`,
          ownerId,
          amount: activity.type === "debug" ? 80 : 60,
          reason: activity.type === "debug" ? "debug_activity_passed" : "code_activity_passed",
          sourceType: "attempt",
          sourceId: attemptId,
          createdAt: new Date()
        });
      }

      this.store.lessonProgressCount = Math.max(this.store.lessonProgressCount, 1);
      this.store.trackProgressCount = Math.max(this.store.trackProgressCount, 1);
    }

    this.store.events.push({
      ownerId,
      id: `memory-event-${this.store.events.length + 1}`,
      type: "activity_submitted",
      entityType: "activity",
      entityId: activity.stableId,
      payload: {
        attemptId,
        attemptNumber,
        outcome: evaluation.outcome
      },
      occurredAt: new Date()
    });

    return {
      attemptId,
      attemptNumber,
      outcome: evaluation.outcome,
      progressUpdated: evaluation.outcome === "passed",
      eventType: "activity_submitted"
    };
  }
}

export class MemoryConceptEvidenceRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async listForConcept(ownerId: string, conceptStableId: string): Promise<ConceptEvidenceRecord[]> {
    return (await this.listForOwner(ownerId)).filter((entry) => entry.conceptStableId === conceptStableId);
  }

  async listForConcepts(ownerId: string, conceptStableIds: readonly string[]): Promise<ConceptEvidenceRecord[]> {
    const selected = new Set(conceptStableIds);
    return (await this.listForOwner(ownerId)).filter(entry => selected.has(entry.conceptStableId));
  }

  async listForOwner(ownerId: string): Promise<ConceptEvidenceRecord[]> {
    return this.store.conceptEvidence
      .filter((entry) => entry.ownerId === ownerId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((entry) => ({
        id: entry.id,
        conceptStableId: entry.conceptStableId,
        type: entry.type,
        strength: entry.strength,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        attemptId: entry.attemptId,
        conditions: entry.conditions,
        createdAt: entry.createdAt
      }));
  }
}
