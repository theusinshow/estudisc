import { getOwnerId } from "@/features/auth/owner";
import { ProgressRepository } from "@/db/repositories/progress-repository";
import { getDatabaseUrl } from "@/db/connection";
import { MemoryProgressRepository } from "@/db/repositories/memory-store";

export async function getLessonProgress(lessonStableId: string) {
  const ownerId = await getOwnerId();

  if (getDatabaseUrl() === "memory://local") {
    return new MemoryProgressRepository().getLessonProgress(ownerId, lessonStableId);
  }

  return new ProgressRepository().getLessonProgress(ownerId, lessonStableId);
}

export async function getTrackProgress(trackStableId: string) {
  const ownerId = await getOwnerId();

  if (getDatabaseUrl() === "memory://local") {
    return new MemoryProgressRepository().getTrackProgress(ownerId, trackStableId);
  }

  return new ProgressRepository().getTrackProgress(ownerId, trackStableId);
}

