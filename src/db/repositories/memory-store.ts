import type {
  CodeActivityRecord,
  LatestAttemptFeedback,
  RecordedSubmission
} from "@/db/repositories/activity-attempt-repository";
import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";
import type { ExportAttemptRecord, ExportEvidenceRecord, ExportSnapshot } from "@/db/repositories/export-repository";
import type { HistoryEvent } from "@/db/repositories/history-repository";
import type { LessonProgressSummary, TrackProgressSummary } from "@/db/repositories/progress-repository";
import type { CompletedReview, DueReview } from "@/db/repositories/review-repository";
import type { MistakeRecord } from "@/db/repositories/mistake-repository";
import type { CreatedProject, ProjectSummary } from "@/db/repositories/project-repository";
import type { GamificationPersistenceState } from "@/db/repositories/gamification-repository";
import type { XpSummary } from "@/db/repositories/xp-repository";
import type {
  AppliedTrackImport,
  ExistingPackImport,
  TrackImportRepository
} from "@/features/import/application/track-import-service";
import type { GamificationSummary } from "@/features/gamification/gamification-rules";
import type { TrackPack, TrackPackLesson, TrackPackActivity } from "@/features/import/application/track-pack-schema";
import { categorizeSubmissionMistake } from "@/features/mistakes/mistake-categorization";
import {
  calculateInitialReviewAt,
  calculateNextReviewAt,
  explainDueReview,
  REVIEW_POLICY_VERSION,
  type ReviewQuality
} from "@/features/review/review-policy";
import type { JavaScriptEvaluationResult } from "@/runtime/javascript/api";

type MemoryTrack = {
  stableId: string;
  title: string;
  description: string | null;
  contentVersion: number;
};

type MemoryModule = {
  stableId: string;
  trackStableId: string;
  title: string;
  orderIndex: number;
};

type MemoryLesson = {
  stableId: string;
  moduleStableId: string;
  title: string;
  contentVersion: number;
  orderIndex: number;
};

type MemoryConcept = {
  stableId: string;
  lessonStableId: string;
  title: string;
  summary: string | null;
};

type MemoryBlock = {
  stableId: string;
  lessonStableId: string;
  type: string;
  orderIndex: number;
  payload: unknown;
};

type MemoryActivity = {
  stableId: string;
  lessonStableId: string;
  trackStableId: string;
  type: string;
  prompt: string;
  orderIndex: number;
  config: unknown;
  evaluatorVersion: string;
};

type MemoryAttempt = {
  id: string;
  ownerId: string;
  activityStableId: string;
  attemptNumber: number;
  outcome: "passed" | "failed";
  source: string;
  output: JavaScriptEvaluationResult["execution"];
  tests: JavaScriptEvaluationResult["tests"];
  createdAt: Date;
  submissionKey?:string;
  response?:unknown;
  questionVersionId?:string;
  context?:Record<string,unknown>;
};

type MemoryConceptEvidence = {
  id: string;
  ownerId: string;
  conceptStableId: string;
  attemptId: string | null;
  type: string;
  strength: number;
  sourceType: string;
  sourceId: string;
  conditions: Record<string, unknown>;
  createdAt: Date;
};

type MemoryReviewSchedule = {
  metadata?:{stage:number;stabilityDays:number};
  ownerId: string;
  conceptStableId: string;
  currentMasteryState: string;
  lastReviewedAt: Date | null;
  nextReviewAt: Date;
  reviewCount: number;
  recentQuality: number;
  policyVersion: string;
  updatedAt: Date;
};

type MemoryMistake = {
  id: string;
  ownerId: string;
  conceptStableId: string;
  attemptId: string;
  category: string;
  summary: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
};

type MemoryProject = {
  ownerId: string;
  stableId: string;
  title: string;
  description: string | null;
  status: string;
  conceptStableIds: Set<string>;
  activityStableIds: Set<string>;
};

type MemoryXpTransaction = {
  id: string;
  ownerId: string;
  amount: number;
  reason: string;
  sourceType: string;
  sourceId: string;
  createdAt: Date;
};

type MemoryBadgeAward = {
  ownerId: string;
  badgeId: string;
  label: string;
  criteriaSnapshot: string;
  sourceType: string;
  sourceId: string;
  createdAt: Date;
};

type MemoryMissionProgress = {
  ownerId: string;
  missionId: string;
  label: string;
  criteriaSnapshot: string;
  status: "available" | "complete";
  href: string;
  completedAt: Date | null;
  sourceType: string;
  sourceId: string;
  updatedAt: Date;
};

type MemoryMissionProgressEvent = {
  ownerId: string;
  missionId: string;
  previousStatus: "available" | "complete" | null;
  nextStatus: "available" | "complete";
  sourceType: string;
  sourceId: string;
  payload: unknown;
  createdAt: Date;
};

type MemoryPackImport = ExistingPackImport & {
  manifest?: TrackPack;
};

type MemoryStore = {
  questionAssistance: Array<{ownerId:string;questionId:string;version:number;contextKey:string;hintLevel:number;solutionRevealed:boolean}>;
  questionExposures: Array<{ownerId:string;questionId:string;lastSeenAt:Date;timesSeen:number}>;
  studySessions:Array<{id:string;ownerId:string;trackId:string;status:string;budgetMinutes:number;items:unknown;policyVersion:string;startedAt:Date|null;endedAt:Date|null;createdAt:Date}>;
  packImports: MemoryPackImport[];
  tracks: MemoryTrack[];
  modules: MemoryModule[];
  lessons: MemoryLesson[];
  concepts: MemoryConcept[];
  blocks: MemoryBlock[];
  activities: MemoryActivity[];
  attempts: MemoryAttempt[];
  conceptEvidence: MemoryConceptEvidence[];
  reviewSchedules: MemoryReviewSchedule[];
  mistakes: MemoryMistake[];
  projects: MemoryProject[];
  xpTransactions: MemoryXpTransaction[];
  badgeAwards: MemoryBadgeAward[];
  missionProgress: MemoryMissionProgress[];
  missionProgressEvents: MemoryMissionProgressEvent[];
  events: Array<HistoryEvent & {ownerId?:string}>;
  lessonProgressCount: number;
  trackProgressCount: number;
};

const globalStore = globalThis as typeof globalThis & {
  __knowOsMemoryStore?: MemoryStore;
};

export function getMemoryStore() {
  globalStore.__knowOsMemoryStore ??= {
    questionAssistance:[],questionExposures:[],studySessions:[],
    packImports: [],
    tracks: [],
    modules: [],
    lessons: [],
    concepts: [],
    blocks: [],
    activities: [],
    attempts: [],
    conceptEvidence: [],
    reviewSchedules: [],
    mistakes: [],
    projects: [],
    xpTransactions: [],
    badgeAwards: [],
    missionProgress: [],
    missionProgressEvents: [],
    events: [],
    lessonProgressCount: 0,
    trackProgressCount: 0
  };

  return globalStore.__knowOsMemoryStore;
}

export class MemoryTrackImportRepository implements TrackImportRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async findPackImport(packId: string, version: number): Promise<ExistingPackImport | null> {
    return this.store.packImports.find((entry) => entry.packId === packId && entry.version === version) ?? null;
  }

  async applyTrackPack(pack: TrackPack, contentHash: string): Promise<AppliedTrackImport> {
    const existing = this.store.packImports.find(
      (entry) => entry.packId === pack.packId && entry.version === pack.version
    );

    if (existing?.contentHash === contentHash) {
      return summarizePack(pack);
    }

    this.store.packImports.push({ packId: pack.packId, version: pack.version, contentHash, manifest: pack });
    this.store.tracks.push({
      stableId: pack.track.id,
      title: pack.track.title,
      description: pack.track.description ?? null,
      contentVersion: pack.version
    });

    let importedLessons = 0;
    let importedActivities = 0;

    pack.track.modules.forEach((module, moduleIndex) => {
      this.store.modules.push({
        stableId: module.id,
        trackStableId: pack.track.id,
        title: module.title,
        orderIndex: moduleIndex
      });

      module.lessons.forEach((lesson, lessonIndex) => {
        this.store.lessons.push({
          stableId: lesson.id,
          moduleStableId: module.id,
          title: lesson.title,
          contentVersion: lesson.version,
          orderIndex: lessonIndex
        });
        importedLessons += 1;

        lesson.concepts.forEach((concept) => {
          this.store.concepts.push({
            stableId: concept.id,
            lessonStableId: lesson.id,
            title: concept.title,
            summary: concept.summary ?? null
          });
        });

        lesson.blocks.forEach((block, blockIndex) => {
          this.store.blocks.push({
            stableId: block.id,
            lessonStableId: lesson.id,
            type: block.type,
            orderIndex: blockIndex,
            payload: pack.schema === "caderno.track.v2" && "payload" in block ? { ...(block.payload as Record<string, unknown>), ...block } : block
          });
        });

        lesson.activities.forEach((activity, activityIndex) => {
          this.store.activities.push({
            stableId: activity.id,
            lessonStableId: lesson.id,
            trackStableId: pack.track.id,
            type: activity.type,
            prompt: activity.prompt,
            orderIndex: activityIndex,
            config: pack.schema === "caderno.track.v2" && "config" in activity ? { ...(activity.config as Record<string, unknown>), ...activity, questionVersion: "questionId" in activity ? pack.questions.find(question => question.id === activity.questionId)?.version : undefined } : activity,
            evaluatorVersion: `${pack.schema}:${pack.version}`
          });
          importedActivities += 1;
        });
      });
    });

    return {
      trackStableId: pack.track.id,
      importedLessons,
      importedActivities
    };
  }
}

function summarizePack(pack: TrackPack): AppliedTrackImport {
    const lessons = pack.track.modules.flatMap<TrackPackLesson>((moduleDefinition) => moduleDefinition.lessons);

  return {
    trackStableId: pack.track.id,
    importedLessons: lessons.length,
    importedActivities: lessons.flatMap<TrackPackActivity>((lesson) => lesson.activities).length
  };
}

export class MemoryCatalogRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async listTracks() {
    return this.store.tracks.map((track) => ({
      stableId: track.stableId,
      title: track.title,
      description: track.description,
      lessonCount: this.store.lessons.filter((lesson) =>
        this.store.modules.some(
          (module) => module.stableId === lesson.moduleStableId && module.trackStableId === track.stableId
        )
      ).length
    }));
  }

  async getTrack(stableId: string) {
    const track = this.store.tracks.find((entry) => entry.stableId === stableId);

    if (!track) {
      return null;
    }

    return {
      stableId: track.stableId,
      title: track.title,
      description: track.description,
      modules: this.store.modules
        .filter((module) => module.trackStableId === stableId)
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map((module) => ({
          stableId: module.stableId,
          title: module.title,
          lessons: this.store.lessons
            .filter((lesson) => lesson.moduleStableId === module.stableId)
            .sort((left, right) => left.orderIndex - right.orderIndex)
            .map((lesson) => ({
              stableId: lesson.stableId,
              title: lesson.title,
              activityCount: this.store.activities.filter((activity) => activity.lessonStableId === lesson.stableId)
                .length
            }))
        }))
    };
  }

  async getLesson(stableId: string) {
    const lesson = this.store.lessons.find((entry) => entry.stableId === stableId);
    const moduleRecord = lesson ? this.store.modules.find((entry) => entry.stableId === lesson.moduleStableId) : null;
    const track = moduleRecord ? this.store.tracks.find((entry) => entry.stableId === moduleRecord.trackStableId) : null;

    if (!lesson || !moduleRecord || !track) {
      return null;
    }

    return {
      stableId: lesson.stableId,
      title: lesson.title,
      trackStableId: track.stableId,
      trackTitle: track.title,
      concepts: this.store.concepts.filter((concept) => concept.lessonStableId === lesson.stableId),
      blocks: this.store.blocks
        .filter((block) => block.lessonStableId === lesson.stableId)
        .sort((left, right) => left.orderIndex - right.orderIndex),
      activities: this.store.activities
        .filter((activity) => activity.lessonStableId === lesson.stableId)
        .sort((left, right) => left.orderIndex - right.orderIndex)
    };
  }

  async getConcept(stableId: string) {
    const concept = this.store.concepts.find((entry) => entry.stableId === stableId);

    if (!concept) {
      return null;
    }

    return {
      stableId: concept.stableId,
      title: concept.title,
      summary: concept.summary,
      lessons: this.store.lessons
        .filter((lesson) =>
          this.store.concepts.some(
            (entry) => entry.lessonStableId === lesson.stableId && entry.stableId === concept.stableId
          )
        )
        .map((lesson) => {
          const moduleRecord = this.store.modules.find((entry) => entry.stableId === lesson.moduleStableId);
          const track = moduleRecord
            ? this.store.tracks.find((entry) => entry.stableId === moduleRecord.trackStableId)
            : null;

          return {
            stableId: lesson.stableId,
            title: lesson.title,
            trackStableId: track?.stableId ?? "",
            trackTitle: track?.title ?? "",
            activityCount: this.store.activities.filter((activity) => activity.lessonStableId === lesson.stableId)
              .length
          };
        })
    };
  }

  async listKnowledgeMapConcepts() {
    const conceptMap = new Map<
      string,
      {
        stableId: string;
        title: string;
        summary: string | null;
        lessonIds: Set<string>;
        trackTitles: Set<string>;
      }
    >();

    for (const concept of this.store.concepts) {
      const existing =
        conceptMap.get(concept.stableId) ??
        ({
          stableId: concept.stableId,
          title: concept.title,
          summary: concept.summary,
          lessonIds: new Set<string>(),
          trackTitles: new Set<string>()
        });

      existing.lessonIds.add(concept.lessonStableId);

      const lesson = this.store.lessons.find((entry) => entry.stableId === concept.lessonStableId);
      const moduleRecord = lesson ? this.store.modules.find((entry) => entry.stableId === lesson.moduleStableId) : null;
      const track = moduleRecord ? this.store.tracks.find((entry) => entry.stableId === moduleRecord.trackStableId) : null;

      if (track) {
        existing.trackTitles.add(track.title);
      }

      conceptMap.set(concept.stableId, existing);
    }

    return Array.from(conceptMap.values())
      .map((concept) => ({
        stableId: concept.stableId,
        title: concept.title,
        summary: concept.summary,
        lessonCount: concept.lessonIds.size,
        trackTitles: Array.from(concept.trackTitles).sort((left, right) => left.localeCompare(right))
      }))
      .sort((left, right) => left.title.localeCompare(right.title));
  }
}

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
      outcome: attempt.outcome,
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
    return this.store.conceptEvidence
      .filter((entry) => entry.ownerId === ownerId && entry.conceptStableId === conceptStableId)
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

export class MemoryProjectRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async createProject({
    ownerId,
    stableId,
    title,
    description = null,
    conceptStableIds = [],
    activityStableIds = []
  }: Readonly<{
    ownerId: string;
    stableId: string;
    title: string;
    description?: string | null;
    conceptStableIds?: readonly string[];
    activityStableIds?: readonly string[];
  }>): Promise<CreatedProject> {
    const existing = this.store.projects.find(
      (project) => project.ownerId === ownerId && project.stableId === stableId
    );
    const knownConceptIds = new Set(this.store.concepts.map((concept) => concept.stableId));
    const linkedConceptIds = conceptStableIds.filter((conceptStableId) => knownConceptIds.has(conceptStableId));
    const knownActivityIds = new Set(this.store.activities.map((activity) => activity.stableId));
    const linkedActivityIds = activityStableIds.filter((activityStableId) => knownActivityIds.has(activityStableId));

    if (existing) {
      existing.title = title;
      existing.description = description;
      linkedConceptIds.forEach((conceptStableId) => existing.conceptStableIds.add(conceptStableId));
      linkedActivityIds.forEach((activityStableId) => existing.activityStableIds.add(activityStableId));

      return {
        stableId: existing.stableId,
        linkedConcepts: existing.conceptStableIds.size,
        linkedActivities: existing.activityStableIds.size
      };
    }

    this.store.projects.push({
      ownerId,
      stableId,
      title,
      description,
      status: "active",
      conceptStableIds: new Set(linkedConceptIds),
      activityStableIds: new Set(linkedActivityIds)
    });

    return {
      stableId,
      linkedConcepts: linkedConceptIds.length,
      linkedActivities: linkedActivityIds.length
    };
  }

  async listProjects(ownerId: string): Promise<ProjectSummary[]> {
    return this.store.projects
      .filter((project) => project.ownerId === ownerId)
      .sort((left, right) => left.title.localeCompare(right.title))
      .map((project) => ({
        stableId: project.stableId,
        title: project.title,
        description: project.description,
        status: project.status,
        conceptCount: project.conceptStableIds.size,
        activityCount: project.activityStableIds.size
      }));
  }
}

export class MemoryXpRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async getSummary(ownerId: string): Promise<XpSummary> {
    const transactions = this.store.xpTransactions
      .filter((transaction) => transaction.ownerId === ownerId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        reason: transaction.reason,
        sourceType: transaction.sourceType,
        sourceId: transaction.sourceId,
        createdAt: transaction.createdAt
      }));

    return {
      totalXp: transactions.reduce((total, transaction) => total + transaction.amount, 0),
      transactions
    };
  }
}

export class MemoryGamificationRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async syncSummary(ownerId: string, summary: GamificationSummary): Promise<GamificationPersistenceState> {
    for (const badge of summary.badges.filter((entry) => entry.earned)) {
      const existing = this.store.badgeAwards.find(
        (award) => award.ownerId === ownerId && award.badgeId === badge.id
      );

      if (!existing) {
        this.store.badgeAwards.push({
          ownerId,
          badgeId: badge.id,
          label: badge.label,
          criteriaSnapshot: badge.criteria,
          sourceType: "gamification_rule",
          sourceId: `gamification.v1:${badge.id}`,
          createdAt: new Date()
        });
      }
    }

    for (const mission of summary.missions) {
      const sourceId = `gamification.v1:${mission.id}`;
      const existing = this.store.missionProgress.find(
        (progress) => progress.ownerId === ownerId && progress.missionId === mission.id
      );

      if (!existing) {
        const now = new Date();

        this.store.missionProgress.push({
          ownerId,
          missionId: mission.id,
          label: mission.label,
          criteriaSnapshot: mission.criteria,
          status: mission.status,
          href: mission.href,
          completedAt: mission.status === "complete" ? now : null,
          sourceType: "gamification_rule",
          sourceId,
          updatedAt: now
        });
        this.store.missionProgressEvents.push({
          ownerId,
          missionId: mission.id,
          previousStatus: null,
          nextStatus: mission.status,
          sourceType: "gamification_rule",
          sourceId,
          payload: {
            label: mission.label,
            criteria: mission.criteria,
            href: mission.href
          },
          createdAt: now
        });
        continue;
      }

      if (existing.status !== mission.status) {
        this.store.missionProgressEvents.push({
          ownerId,
          missionId: mission.id,
          previousStatus: existing.status,
          nextStatus: mission.status,
          sourceType: "gamification_rule",
          sourceId,
          payload: {
            label: mission.label,
            criteria: mission.criteria,
            href: mission.href
          },
          createdAt: new Date()
        });
      }

      existing.label = mission.label;
      existing.criteriaSnapshot = mission.criteria;
      existing.status = mission.status;
      existing.href = mission.href;
      existing.completedAt =
        mission.status === "complete" ? (existing.completedAt ?? new Date()) : existing.completedAt;
      existing.sourceType = "gamification_rule";
      existing.sourceId = sourceId;
      existing.updatedAt = new Date();
    }

    return this.getState(ownerId);
  }

  async getState(ownerId: string): Promise<GamificationPersistenceState> {
    return {
      badgeAwards: this.store.badgeAwards
        .filter((award) => award.ownerId === ownerId)
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
        .map((award) => ({
          badgeId: award.badgeId,
          label: award.label,
          criteriaSnapshot: award.criteriaSnapshot,
          sourceType: award.sourceType,
          sourceId: award.sourceId,
          createdAt: award.createdAt
        })),
      missionProgress: this.store.missionProgress
        .filter((progress) => progress.ownerId === ownerId)
        .sort((left, right) => left.missionId.localeCompare(right.missionId))
        .map((progress) => ({
          missionId: progress.missionId,
          label: progress.label,
          criteriaSnapshot: progress.criteriaSnapshot,
          status: progress.status,
          href: progress.href,
          completedAt: progress.completedAt,
          sourceType: progress.sourceType,
          sourceId: progress.sourceId,
          updatedAt: progress.updatedAt
        })),
      missionEvents: this.store.missionProgressEvents
        .filter((event) => event.ownerId === ownerId)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
        .map((event) => ({
          missionId: event.missionId,
          previousStatus: event.previousStatus,
          nextStatus: event.nextStatus,
          sourceType: event.sourceType,
          sourceId: event.sourceId,
          payload: event.payload,
          createdAt: event.createdAt
        }))
    };
  }
}

export class MemoryExportRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async getSnapshot(ownerId: string): Promise<ExportSnapshot> {
    const catalogRepository = new MemoryCatalogRepository(this.store);

    return {
      packManifests: this.store.packImports.map((packImport) => packImport.manifest).filter(Boolean),
      tracks: await catalogRepository.listTracks(),
      knowledgeMap: await catalogRepository.listKnowledgeMapConcepts(),
      masteryEvidence: this.listMasteryEvidence(ownerId),
      recentAttempts: this.listRecentAttempts(ownerId),
      dueReviews: await new MemoryReviewRepository(this.store).listDueReviews(ownerId),
      mistakes: await new MemoryMistakeRepository(this.store).listMistakes(ownerId),
      projects: await new MemoryProjectRepository(this.store).listProjects(ownerId),
      xpSummary: await new MemoryXpRepository(this.store).getSummary(ownerId),
      gamification: await new MemoryGamificationRepository(this.store).getState(ownerId),
      events: await new MemoryHistoryRepository(this.store).listEvents()
    };
  }

  private listMasteryEvidence(ownerId: string): ExportEvidenceRecord[] {
    return this.store.conceptEvidence
      .filter((entry) => entry.ownerId === ownerId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((entry) => {
        const concept = this.store.concepts.find((candidate) => candidate.stableId === entry.conceptStableId);

        return {
          id: entry.id,
          conceptStableId: entry.conceptStableId,
          conceptTitle: concept?.title ?? entry.conceptStableId,
          type: entry.type,
          strength: entry.strength,
          sourceType: entry.sourceType,
          sourceId: entry.sourceId,
          conditions: entry.conditions,
          createdAt: entry.createdAt
        };
      });
  }

  private listRecentAttempts(ownerId: string): ExportAttemptRecord[] {
    return this.store.attempts
      .filter((entry) => entry.ownerId === ownerId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((attempt) => {
        const activity = this.store.activities.find((entry) => entry.stableId === attempt.activityStableId);

        return {
          id: attempt.id,
          activityStableId: attempt.activityStableId,
          activityType: activity?.type ?? "unknown",
          activityPrompt: activity?.prompt ?? "",
          attemptNumber: attempt.attemptNumber,
          outcome: attempt.outcome,
          source: attempt.source,
          createdAt: attempt.createdAt
        };
      });
  }
}

function parseActivityConceptStableIds(config: unknown) {
  if (
    typeof config === "object" &&
    config !== null &&
    "conceptIds" in config &&
    Array.isArray(config.conceptIds)
  ) {
    return config.conceptIds.filter((conceptId): conceptId is string => typeof conceptId === "string");
  }

  return [];
}

function getEvidenceTypeForActivityType(activityType: string) {
  if (activityType === "debug") {
    return "bug_diagnosed";
  }

  return "code_written";
}

export class MemoryProgressRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async getLessonProgress(ownerId: string, lessonStableId: string): Promise<LessonProgressSummary | null> {
    const lesson = this.store.lessons.find((entry) => entry.stableId === lessonStableId);

    if (!lesson) {
      return null;
    }

    const activityIds = this.store.activities
      .filter((activity) => activity.lessonStableId === lesson.stableId)
      .map((activity) => activity.stableId);
    const attemptRows = this.listAttemptRows(ownerId, activityIds);

    return {
      lessonStableId: lesson.stableId,
      totalActivities: activityIds.length,
      attemptedActivities: new Set(attemptRows.map((attempt) => attempt.activityStableId)).size,
      passedActivities: new Set(
        attemptRows.filter((attempt) => attempt.outcome === "passed").map((attempt) => attempt.activityStableId)
      ).size,
      masteryStatus: "not_calculated"
    };
  }

  async getTrackProgress(ownerId: string, trackStableId: string): Promise<TrackProgressSummary | null> {
    const track = this.store.tracks.find((entry) => entry.stableId === trackStableId);

    if (!track) {
      return null;
    }

    const lessonIds = this.store.lessons
      .filter((lesson) =>
        this.store.modules.some(
          (module) => module.stableId === lesson.moduleStableId && module.trackStableId === track.stableId
        )
      )
      .map((lesson) => lesson.stableId);
    const activitiesByLesson = new Map<string, string[]>();

    for (const lessonId of lessonIds) {
      activitiesByLesson.set(
        lessonId,
        this.store.activities
          .filter((activity) => activity.lessonStableId === lessonId)
          .map((activity) => activity.stableId)
      );
    }

    const activityIds = Array.from(activitiesByLesson.values()).flat();
    const attemptRows = this.listAttemptRows(ownerId, activityIds);
    const passedActivityIds = new Set(
      attemptRows.filter((attempt) => attempt.outcome === "passed").map((attempt) => attempt.activityStableId)
    );
    const completedLessons = Array.from(activitiesByLesson.values()).filter(
      (lessonActivityIds) =>
        lessonActivityIds.length > 0 && lessonActivityIds.every((activityId) => passedActivityIds.has(activityId))
    ).length;

    return {
      trackStableId: track.stableId,
      totalLessons: lessonIds.length,
      completedLessons,
      totalActivities: activityIds.length,
      attemptedActivities: new Set(attemptRows.map((attempt) => attempt.activityStableId)).size,
      passedActivities: passedActivityIds.size,
      masteryStatus: "not_calculated"
    };
  }

  private listAttemptRows(ownerId: string, activityIds: string[]) {
    return this.store.attempts.filter(
      (attempt) => attempt.ownerId === ownerId && activityIds.includes(attempt.activityStableId)
    );
  }
}

export class MemoryHistoryRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async listEvents(ownerId="local-owner"): Promise<HistoryEvent[]> {
    return this.store.events.filter(event=>!event.ownerId||event.ownerId===ownerId).sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
  }
}
