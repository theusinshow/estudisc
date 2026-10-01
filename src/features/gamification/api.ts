import { getOwnerId } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { GamificationRepository } from "@/db/repositories/gamification-repository";
import { MemoryGamificationRepository, MemoryXpRepository } from "@/db/repositories/memory-store";
import { XpRepository } from "@/db/repositories/xp-repository";
import { listMistakes } from "@/features/mistakes/api";
import { getDueReviews } from "@/features/review/api";
import { attachGamificationPersistence, buildGamificationSummary } from "@/features/gamification/gamification-rules";

type XpStore = Pick<XpRepository, "getSummary">;
type GamificationStore = Pick<GamificationRepository, "getState" | "syncSummary">;

export async function getXpSummary(repository: XpStore = createXpRepository()) {
  return repository.getSummary(await getOwnerId());
}

export async function getGamificationSummary() {
  const ownerId = await getOwnerId();
  const [xp, dueReviews, mistakes] = await Promise.all([getXpSummary(), getDueReviews(), listMistakes()]);
  const summary = buildGamificationSummary({ xp, dueReviews, mistakes });
  const persistence = await createGamificationRepository().syncSummary(ownerId, summary);

  return attachGamificationPersistence(summary, persistence);
}

function createXpRepository(): XpStore {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryXpRepository();
  }

  return new XpRepository();
}

function createGamificationRepository(): GamificationStore {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryGamificationRepository();
  }

  return new GamificationRepository();
}

