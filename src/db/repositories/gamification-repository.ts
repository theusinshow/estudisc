import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { getDatabase } from "@/db/connection";
import { badgeAwards, missionProgress, missionProgressEvents, owners } from "@/db/schema";
import type * as schema from "@/db/schema";
import type { GamificationSummary } from "@/features/gamification/gamification-rules";
import { GAMIFICATION_POLICY_VERSION } from "@/features/gamification/study-rewards";

type GamificationDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type BadgeAwardRecord = Readonly<{
  badgeId: string;
  label: string;
  criteriaSnapshot: string;
  sourceType: string;
  sourceId: string;
  createdAt: Date;
}>;

export type MissionProgressRecord = Readonly<{
  missionId: string;
  label: string;
  criteriaSnapshot: string;
  status: "available" | "complete";
  href: string;
  completedAt: Date | null;
  sourceType: string;
  sourceId: string;
  updatedAt: Date;
}>;

export type MissionProgressEventRecord = Readonly<{
  missionId: string;
  previousStatus: "available" | "complete" | null;
  nextStatus: "available" | "complete";
  sourceType: string;
  sourceId: string;
  payload: unknown;
  createdAt: Date;
}>;

export type GamificationPersistenceState = Readonly<{
  badgeAwards: BadgeAwardRecord[];
  missionProgress: MissionProgressRecord[];
  missionEvents: MissionProgressEventRecord[];
}>;

export class GamificationRepository {
  constructor(private readonly db: GamificationDatabase = getDatabase()) {}

  async syncSummary(ownerId: string, summary: GamificationSummary): Promise<GamificationPersistenceState> {
    await this.db.transaction(async (tx) => {
      await tx
        .insert(owners)
        .values({ id: ownerId, displayName: "Local owner" })
        .onConflictDoNothing({ target: owners.id });

      for (const badge of summary.badges.filter((entry) => entry.earned)) {
        await tx
          .insert(badgeAwards)
          .values({
            ownerId,
            badgeId: badge.id,
            label: badge.label,
            criteriaSnapshot: badge.criteria,
            sourceType: "gamification_rule",
            sourceId: `${GAMIFICATION_POLICY_VERSION}:${badge.id}`
          })
          .onConflictDoNothing({ target: [badgeAwards.ownerId, badgeAwards.badgeId] });
      }

      const missionIds = summary.missions.map((mission) => mission.id);
      const existingMissions =
        missionIds.length > 0
          ? await tx
              .select({
                missionId: missionProgress.missionId,
                status: missionProgress.status,
                completedAt: missionProgress.completedAt
              })
              .from(missionProgress)
              .where(and(eq(missionProgress.ownerId, ownerId), inArray(missionProgress.missionId, missionIds)))
          : [];
      const existingByMissionId = new Map(existingMissions.map((mission) => [mission.missionId, mission]));

      for (const mission of summary.missions) {
        const existing = existingByMissionId.get(mission.id);
        const completedAt =
          mission.status === "complete" ? (existing?.completedAt ?? new Date()) : (existing?.completedAt ?? null);
        const sourceId = `${GAMIFICATION_POLICY_VERSION}:${mission.id}`;

        await tx
          .insert(missionProgress)
          .values({
            ownerId,
            missionId: mission.id,
            label: mission.label,
            criteriaSnapshot: mission.criteria,
            status: mission.status,
            href: mission.href,
            completedAt,
            sourceType: "gamification_rule",
            sourceId
          })
          .onConflictDoUpdate({
            target: [missionProgress.ownerId, missionProgress.missionId],
            set: {
              label: mission.label,
              criteriaSnapshot: mission.criteria,
              status: mission.status,
              href: mission.href,
              completedAt,
              sourceType: "gamification_rule",
              sourceId,
              updatedAt: sql`now()`
            }
          });

        if (!existing || existing.status !== mission.status) {
          await tx.insert(missionProgressEvents).values({
            ownerId,
            missionId: mission.id,
            previousStatus: existing?.status ?? null,
            nextStatus: mission.status,
            sourceType: "gamification_rule",
            sourceId,
            payload: {
              label: mission.label,
              criteria: mission.criteria,
              href: mission.href
            }
          });
        }
      }
    });

    return this.getState(ownerId);
  }

  async getState(ownerId: string): Promise<GamificationPersistenceState> {
    const [awards, progress, events] = await Promise.all([
      this.db
        .select({
          badgeId: badgeAwards.badgeId,
          label: badgeAwards.label,
          criteriaSnapshot: badgeAwards.criteriaSnapshot,
          sourceType: badgeAwards.sourceType,
          sourceId: badgeAwards.sourceId,
          createdAt: badgeAwards.createdAt
        })
        .from(badgeAwards)
        .where(eq(badgeAwards.ownerId, ownerId))
        .orderBy(asc(badgeAwards.createdAt), asc(badgeAwards.badgeId)),
      this.db
        .select({
          missionId: missionProgress.missionId,
          label: missionProgress.label,
          criteriaSnapshot: missionProgress.criteriaSnapshot,
          status: missionProgress.status,
          href: missionProgress.href,
          completedAt: missionProgress.completedAt,
          sourceType: missionProgress.sourceType,
          sourceId: missionProgress.sourceId,
          updatedAt: missionProgress.updatedAt
        })
        .from(missionProgress)
        .where(eq(missionProgress.ownerId, ownerId))
        .orderBy(asc(missionProgress.missionId)),
      this.db
        .select({
          missionId: missionProgressEvents.missionId,
          previousStatus: missionProgressEvents.previousStatus,
          nextStatus: missionProgressEvents.nextStatus,
          sourceType: missionProgressEvents.sourceType,
          sourceId: missionProgressEvents.sourceId,
          payload: missionProgressEvents.payload,
          createdAt: missionProgressEvents.createdAt
        })
        .from(missionProgressEvents)
        .where(eq(missionProgressEvents.ownerId, ownerId))
        .orderBy(desc(missionProgressEvents.createdAt))
    ]);

    return {
      badgeAwards: awards,
      missionProgress: progress.map((mission) => ({
        ...mission,
        status: mission.status === "complete" ? "complete" : "available"
      })),
      missionEvents: events.map((event) => ({
        ...event,
        previousStatus:
          event.previousStatus === "complete" || event.previousStatus === "available" ? event.previousStatus : null,
        nextStatus: event.nextStatus === "complete" ? "complete" : "available"
      }))
    };
  }
}
