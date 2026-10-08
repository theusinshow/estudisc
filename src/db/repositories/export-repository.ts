import { desc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { getDatabase } from "@/db/connection";
import { CatalogRepository, type KnowledgeMapConcept, type TrackListItem } from "@/db/repositories/catalog-repository";
import { GamificationRepository, type GamificationPersistenceState } from "@/db/repositories/gamification-repository";
import { HistoryRepository, type HistoryEvent } from "@/db/repositories/history-repository";
import { MistakeRepository, type MistakeRecord } from "@/db/repositories/mistake-repository";
import { ProjectRepository, type ProjectSummary } from "@/db/repositories/project-repository";
import { ReviewRepository, type DueReview } from "@/db/repositories/review-repository";
import { XpRepository, type XpSummary } from "@/db/repositories/xp-repository";
import { activities, attempts, conceptEvidence, concepts, packImports,questions,questionVersions } from "@/db/schema";
import type * as schema from "@/db/schema";
import { LearningStateExportRepository,type LearningStateExport } from "./learning-state-export-repository";

type ExportDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type ExportEvidenceRecord = Readonly<{
  id: string;
  conceptStableId: string;
  conceptTitle: string;
  type: string;
  strength: number;
  sourceType: string;
  sourceId: string;
  conditions: unknown;
  createdAt: Date;
}>;

export type ExportAttemptRecord = Readonly<{
  id: string;
  activityStableId: string;
  activityType: string;
  activityPrompt: string;
  attemptNumber: number;
  outcome: string;
  source: string;
  createdAt: Date;
  response?:unknown;
  context?:unknown;
  questionVersion?:number|null;
}>;

export type ExportSnapshot = Readonly<{
  packManifests: unknown[];
  tracks: TrackListItem[];
  knowledgeMap: KnowledgeMapConcept[];
  masteryEvidence: ExportEvidenceRecord[];
  recentAttempts: ExportAttemptRecord[];
  dueReviews: DueReview[];
  mistakes: MistakeRecord[];
  projects: ProjectSummary[];
  xpSummary: XpSummary;
  gamification: GamificationPersistenceState;
  events: HistoryEvent[];
  learningState?: LearningStateExport;
}>;

export class ExportRepository {
  constructor(private readonly db: ExportDatabase = getDatabase()) {}

  async getSnapshot(ownerId: string): Promise<ExportSnapshot> {
    const catalogRepository = new CatalogRepository(this.db);

    const [
      packManifests,
      tracks,
      knowledgeMap,
      masteryEvidence,
      recentAttempts,
      dueReviews,
      mistakes,
      projects,
      xpSummary,
      gamification,
      events,
      learningState
    ] = await Promise.all([
      this.listPackManifests(),
      catalogRepository.listTracks(),
      catalogRepository.listKnowledgeMapConcepts(),
      this.listMasteryEvidence(ownerId),
      this.listAttempts(ownerId),
      new ReviewRepository(this.db).listDueReviews(ownerId),
      new MistakeRepository(this.db).listMistakes(ownerId),
      new ProjectRepository(this.db).listProjects(ownerId),
      new XpRepository(this.db).getSummary(ownerId),
      new GamificationRepository(this.db).getState(ownerId),
      new HistoryRepository(this.db).listEvents(ownerId),
      new LearningStateExportRepository(this.db).get(ownerId)
    ]);

    return {
      packManifests,
      tracks,
      knowledgeMap,
      masteryEvidence,
      recentAttempts,
      dueReviews,
      mistakes,
      projects,
      xpSummary,
      gamification,
      events,
      learningState
    };
  }

  private async listPackManifests(): Promise<unknown[]> {
    const rows = await this.db
      .select({ manifest: packImports.manifest })
      .from(packImports)
      .orderBy(desc(packImports.importedAt));

    return rows.map((row) => row.manifest);
  }

  private async listMasteryEvidence(ownerId: string): Promise<ExportEvidenceRecord[]> {
    return this.db
      .select({
        id: conceptEvidence.id,
        conceptStableId: concepts.stableId,
        conceptTitle: concepts.title,
        type: conceptEvidence.type,
        strength: conceptEvidence.strength,
        sourceType: conceptEvidence.sourceType,
        sourceId: conceptEvidence.sourceId,
        conditions: conceptEvidence.conditions,
        createdAt: conceptEvidence.createdAt
      })
      .from(conceptEvidence)
      .innerJoin(concepts, eq(concepts.id, conceptEvidence.conceptId))
      .where(eq(conceptEvidence.ownerId, ownerId))
      .orderBy(desc(conceptEvidence.createdAt));
  }

  private async listAttempts(ownerId: string): Promise<ExportAttemptRecord[]> {
    const rows = await this.db
      .select({
        id: attempts.id,
        activityStableId: activities.stableId,
        activityType: activities.type,
        activityPrompt: activities.prompt,
        attemptNumber: attempts.attemptNumber,
        outcome: attempts.outcome,
        response: attempts.response,
        context:attempts.context,
        questionStableId:questions.stableId,
        questionVersion:questionVersions.version,
        questionContent:questionVersions.content,
        createdAt: attempts.createdAt
      })
      .from(attempts)
      .leftJoin(activities, eq(activities.id, attempts.activityId))
      .leftJoin(questionVersions,eq(questionVersions.id,attempts.questionVersionId))
      .leftJoin(questions,eq(questions.id,questionVersions.questionId))
      .where(eq(attempts.ownerId, ownerId))
      .orderBy(desc(attempts.createdAt));

    return rows.map((row) => ({
      id: row.id,
      activityStableId: row.activityStableId??row.questionStableId??"historical-question",
      activityType: row.activityType??"question",
      activityPrompt: row.activityPrompt??(row.questionContent as {stem?:string}|null)?.stem??"Questão histórica",
      response:row.response,context:row.context,questionVersion:row.questionVersion,
      attemptNumber: row.attemptNumber,
      outcome: row.outcome,
      source: parseAttemptSource(row.response),
      createdAt: row.createdAt
    }));
  }
}

function parseAttemptSource(response: unknown) {
  if (
    typeof response === "object" &&
    response !== null &&
    "source" in response &&
    typeof response.source === "string"
  ) {
    return response.source;
  }

  return "";
}
