import type { HistoryEvent } from "@/db/repositories/history-repository";
import type { AppliedTrackImport, ExistingPackImport } from "@/features/import/application/track-import-service";
import type { TrackPack, TrackPackLesson, TrackPackActivity } from "@/features/import/application/track-pack-schema";
import type { JavaScriptEvaluationResult } from "@/runtime/javascript/api";
import type { AssessmentTemplate, AssessmentSnapshot } from "@/features/assessments/contracts";

export type MemoryTrack = {
  stableId: string;
  title: string;
  description: string | null;
  contentVersion: number;
};

export type MemoryModule = {
  stableId: string;
  trackStableId: string;
  title: string;
  orderIndex: number;
};

export type MemoryLesson = {
  stableId: string;
  moduleStableId: string;
  title: string;
  contentVersion: number;
  orderIndex: number;
};

export type MemoryConcept = {
  stableId: string;
  lessonStableId: string;
  title: string;
  summary: string | null;
};

export type MemoryBlock = {
  stableId: string;
  lessonStableId: string;
  type: string;
  orderIndex: number;
  payload: unknown;
};

export type MemoryActivity = {
  stableId: string;
  lessonStableId: string;
  trackStableId: string;
  type: string;
  prompt: string;
  orderIndex: number;
  config: unknown;
  evaluatorVersion: string;
};

export type MemoryAttempt = {
  id: string;
  ownerId: string;
  activityStableId: string;
  attemptNumber: number;
  outcome: "passed" | "failed" | "annulled";
  source: string;
  output: JavaScriptEvaluationResult["execution"];
  tests: JavaScriptEvaluationResult["tests"];
  createdAt: Date;
  submissionKey?:string;
  response?:unknown;
  questionVersionId?:string;
  context?:Record<string,unknown>;
};

export type MemoryConceptEvidence = {
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

export type MemoryReviewSchedule = {
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

export type MemoryMistake = {
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

export type MemoryProject = {
  ownerId: string;
  stableId: string;
  title: string;
  description: string | null;
  status: string;
  conceptStableIds: Set<string>;
  activityStableIds: Set<string>;
};

export type MemoryXpTransaction = {
  id: string;
  ownerId: string;
  amount: number;
  reason: string;
  sourceType: string;
  sourceId: string;
  createdAt: Date;
};

export type MemoryBadgeAward = {
  ownerId: string;
  badgeId: string;
  label: string;
  criteriaSnapshot: string;
  sourceType: string;
  sourceId: string;
  createdAt: Date;
};

export type MemoryMissionProgress = {
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

export type MemoryMissionProgressEvent = {
  ownerId: string;
  missionId: string;
  previousStatus: "available" | "complete" | null;
  nextStatus: "available" | "complete";
  sourceType: string;
  sourceId: string;
  payload: unknown;
  createdAt: Date;
};

export type MemoryPackImport = ExistingPackImport & {
  manifest?: TrackPack;
};

export type MemoryStore = {
  questionAssets:Array<{id:string;questionId:string;version:number;bytes:Buffer;contentHash:string;mimeType:string}>;
  assessmentTemplates:Array<{id:string;definition:AssessmentTemplate;contentHash:string}>;
  assessmentInstances:Array<{id:string;ownerId:string;templateId:string;startKey:string;status:string;snapshot:AssessmentSnapshot;startedAt:Date;deadlineAt:Date;finalizedAt:Date|null;result:unknown}>;
  assessmentResponses:Array<{instanceId:string;versionId:string;response:unknown;flagged:boolean}>;
  questionAssistance: Array<{ownerId:string;questionId:string;version:number;contextKey:string;hintLevel:number;solutionRevealed:boolean}>;
  questionExposures: Array<{ownerId:string;questionId:string;lastSeenAt:Date;timesSeen:number}>;
  studySessions:Array<{id:string;ownerId:string;trackId:string;status:string;budgetMinutes:number;items:unknown;policyVersion:string;startedAt:Date|null;endedAt:Date|null;createdAt:Date}>;
  studyPlans: Array<{ownerId:string;revision:number;settings:unknown;updatedAt:Date}>;
  studyPlanPreviews: Array<{id:string;ownerId:string;baseRevision:number;settings:unknown;snapshot:unknown;dependencyHash:string;policyVersion:string;createdAt:Date;expiresAt:Date;appliedRevision:number|null;appliedAt:Date|null}>;
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
  __estudiscMemoryStore?: MemoryStore;
};

export function getMemoryStore() {
  globalStore.__estudiscMemoryStore ??= {
    questionAssets:[],
    assessmentTemplates:[],assessmentInstances:[],assessmentResponses:[],
    questionAssistance:[],questionExposures:[],studySessions:[],
    studyPlans:[],studyPlanPreviews:[],
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

  globalStore.__estudiscMemoryStore.studyPlans ??= [];
  globalStore.__estudiscMemoryStore.studyPlanPreviews ??= [];
  return globalStore.__estudiscMemoryStore;
}

export function summarizePack(pack: TrackPack): AppliedTrackImport {
    const lessons = pack.track.modules.flatMap<TrackPackLesson>((moduleDefinition) => moduleDefinition.lessons);

  return {
    trackStableId: pack.track.id,
    importedLessons: lessons.length,
    importedActivities: lessons.flatMap<TrackPackActivity>((lesson) => lesson.activities).length
  };
}

export function parseActivityConceptStableIds(config: unknown) {
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

export function getEvidenceTypeForActivityType(activityType: string) {
  if (activityType === "debug") {
    return "bug_diagnosed";
  }

  return "code_written";
}
