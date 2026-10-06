import type { GamificationPersistenceState } from "@/db/repositories/gamification-repository";
import type { XpSummary } from "@/db/repositories/xp-repository";
import type { GamificationSummary } from "@/features/gamification/gamification-rules";
import { GAMIFICATION_POLICY_VERSION } from "@/features/gamification/study-rewards";
import { getMemoryStore } from './store';


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
          sourceId: `${GAMIFICATION_POLICY_VERSION}:${badge.id}`,
          createdAt: new Date()
        });
      }
    }

    for (const mission of summary.missions) {
      const sourceId = `${GAMIFICATION_POLICY_VERSION}:${mission.id}`;
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
