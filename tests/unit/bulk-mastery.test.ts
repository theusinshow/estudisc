import { afterEach, describe, expect, it, vi } from "vitest";
import { getMemoryStore, MemoryConceptEvidenceRepository, MemoryProgressRepository } from "@/db/repositories/memory-store";
import { getLessonProgress } from "@/features/progress/api";

vi.mock("@/features/auth/owner", () => ({ getOwnerId: async () => "owner-a" }));
vi.mock("@/db/connection", () => ({ getDatabaseUrl: () => "memory://local" }));

describe("bulk mastery evidence", () => {
  afterEach(() => vi.restoreAllMocks());
  it("keeps owner/Concept isolation when selecting several targets", async () => {
    const store = getMemoryStore();
    const prior = store.conceptEvidence;
    store.conceptEvidence = [
      { id: "a", ownerId: "owner-a", conceptStableId: "c1", type: "attempt", strength: 1, sourceType: "question", sourceId: "q", attemptId: null, conditions: {}, createdAt: new Date() },
      { id: "b", ownerId: "owner-b", conceptStableId: "c1", type: "attempt", strength: 1, sourceType: "question", sourceId: "q", attemptId: null, conditions: {}, createdAt: new Date() },
      { id: "c", ownerId: "owner-a", conceptStableId: "unrelated", type: "attempt", strength: 1, sourceType: "question", sourceId: "q", attemptId: null, conditions: {}, createdAt: new Date() }
    ];
    try { expect((await new MemoryConceptEvidenceRepository().listForConcepts("owner-a", ["c1", "c2"])).map(row => row.id)).toEqual(["a"]); }
    finally { store.conceptEvidence = prior; }
  });
  it("performs one bulk evidence read rather than one read for every Concept", async () => {
    vi.spyOn(MemoryProgressRepository.prototype, "getLessonProgress").mockResolvedValue({ lessonStableId: "lesson", lessonTitle: "Lesson", totalActivities: 2, passedActivities: 0, attemptedActivities: 0, completionPercent: 0 } as never);
    const bulk = vi.spyOn(MemoryConceptEvidenceRepository.prototype, "listForConcepts").mockResolvedValue([]);
    const single = vi.spyOn(MemoryConceptEvidenceRepository.prototype, "listForConcept");
    const progress = await getLessonProgress("lesson", ["c1", "c2", "c1"]);
    expect(progress?.mastery).toBeDefined();
    expect(bulk).toHaveBeenCalledTimes(1);
    expect(single).not.toHaveBeenCalled();
  });
});
