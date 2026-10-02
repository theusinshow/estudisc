import { getOwnerId } from "@/features/auth/owner";
import { ProgressRepository } from "@/db/repositories/progress-repository";
import { ConceptEvidenceRepository } from "@/db/repositories/concept-evidence-repository";
import { getDatabaseUrl } from "@/db/connection";
import { MemoryConceptEvidenceRepository, MemoryProgressRepository } from "@/db/repositories/memory-store";
import { calculateVersionedMastery } from "@/features/mastery/mastery-policy-v2";
import { summarizeConceptMastery, type ConceptMasterySummary } from "./mastery-summary";

export async function getLessonProgress(lessonStableId: string, conceptStableIds: readonly string[] = []) {
  const ownerId = await getOwnerId();
  const memory = getDatabaseUrl() === "memory://local";
  const progress = await (memory ? new MemoryProgressRepository() : new ProgressRepository()).getLessonProgress(ownerId, lessonStableId);

  if (!progress) {
    return null;
  }

  return { ...progress, mastery: await getConceptMasterySummary(ownerId, conceptStableIds, memory) };
}

export async function getTrackProgress(trackStableId: string) {
  const ownerId = await getOwnerId();

  if (getDatabaseUrl() === "memory://local") {
    return new MemoryProgressRepository().getTrackProgress(ownerId, trackStableId);
  }

  return new ProgressRepository().getTrackProgress(ownerId, trackStableId);
}

// Mastery comes only from the versioned policy over append-only ConceptEvidence; lesson completion never feeds it.
async function getConceptMasterySummary(ownerId: string, conceptStableIds: readonly string[], memory: boolean): Promise<ConceptMasterySummary | undefined> {
  if (conceptStableIds.length === 0) {
    return undefined;
  }

  const repository = memory ? new MemoryConceptEvidenceRepository() : new ConceptEvidenceRepository();
  const states = await Promise.all(
    conceptStableIds.map(async (conceptStableId) => calculateVersionedMastery(await repository.listForConcept(ownerId, conceptStableId)))
  );
  return summarizeConceptMastery(states);
}
