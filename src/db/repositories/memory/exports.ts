import type { ExportAttemptRecord, ExportEvidenceRecord, ExportSnapshot } from "@/db/repositories/export-repository";
import { getMemoryStore } from './store';
import { MemoryCatalogRepository } from './catalog';
import { MemoryReviewRepository } from './reviews';
import { MemoryMistakeRepository } from './reviews';
import { MemoryProjectRepository } from './projects';
import { MemoryXpRepository } from './gamification';
import { MemoryGamificationRepository } from './gamification';
import { MemoryHistoryRepository } from './progress';
import { MemoryLearningStateExportRepository } from '../learning-state-export-repository';

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
      events: await new MemoryHistoryRepository(this.store).listEvents(ownerId),
      learningState: await new MemoryLearningStateExportRepository(this.store).get(ownerId)
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
