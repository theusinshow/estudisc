import { getOwnerId } from "@/features/auth/owner";
import { ProgressRepository } from "@/db/repositories/progress-repository";
import { ConceptEvidenceRepository } from "@/db/repositories/concept-evidence-repository";
import { getDatabaseUrl } from "@/db/connection";
import { MemoryConceptEvidenceRepository, MemoryProgressRepository } from "@/db/repositories/memory-store";
import { calculateVersionedMastery } from "@/features/mastery/mastery-policy-v2";
import { summarizeConceptMastery, type ConceptMasterySummary } from "./mastery-summary";
import { buildProgressOverview, type ProgressOverview } from "./overview";
import { listKnowledgeMapConcepts } from "@/features/concepts/knowledge-map-api";
import { listHistoryEvents } from "@/features/history/api";

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
  const evidence = await repository.listForConcepts(ownerId, conceptStableIds);
  const groups = new Map<string, typeof evidence>();
  for (const item of evidence) { const rows = groups.get(item.conceptStableId) ?? []; rows.push(item); groups.set(item.conceptStableId, rows); }
  const states = [...new Set(conceptStableIds)].map(id => calculateVersionedMastery(groups.get(id) ?? []));
  return summarizeConceptMastery(states);
}

export async function getProgressOverview(now = new Date()): Promise<ProgressOverview> {
  if (!getDatabaseUrl()) {
    return buildProgressOverview({ concepts: [], evidence: [], eventDates: [], now });
  }

  const ownerId = await getOwnerId();
  const memory = getDatabaseUrl() === "memory://local";
  const [concepts, evidence, events] = await Promise.all([
    listKnowledgeMapConcepts(),
    (memory ? new MemoryConceptEvidenceRepository() : new ConceptEvidenceRepository()).listForOwner(ownerId),
    listHistoryEvents()
  ]);

  return buildProgressOverview({ concepts, evidence, eventDates: events.map((event) => event.occurredAt), now });
}
