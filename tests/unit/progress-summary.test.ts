import { describe, expect, it } from "vitest";
import { buildProgressOverview } from "@/features/progress/overview";
import { subjectAreaTitle, subjectAreas } from "@/features/progress/subject-alias";
import { calculateRank } from "@/features/gamification/gamification-rules";
import { xpReasonLabel } from "@/features/gamification/study-rewards";

const now = new Date("2026-10-01T15:00:00Z");

describe("subject alias", () => {
  it("shows Português and Língua Portuguesa as one area, counting a shared Concept once", () => {
    expect(subjectAreaTitle("Português")).toBe("Língua Portuguesa");
    expect(subjectAreas(["Português", "Língua Portuguesa"])).toEqual(["Língua Portuguesa"]);
    const overview = buildProgressOverview({ concepts: [
      { stableId: "genre", title: "Gênero", areaTitles: ["Língua Portuguesa", "Português"] },
      { stableId: "comma", title: "Vírgula", areaTitles: ["Português"] }
    ], evidence: [], now });
    expect(overview.areas).toEqual([expect.objectContaining({ title: "Língua Portuguesa", conceptCount: 2 })]);
  });
});

describe("mastery ladder", () => {
  it("adds up to the total number of Concepts, with no Concept counted twice", () => {
    const concept = { stableId: "genre", title: "Gênero", areaTitles: ["Língua Portuguesa"] };
    const overview = buildProgressOverview({ concepts: [concept, { ...concept, areaTitles: ["Português"] }, { stableId: "comma", title: "Vírgula", areaTitles: ["Português"] }], evidence: [], now });
    expect(overview.totalConcepts).toBe(2);
    expect(overview.ladder.reduce((sum, rung) => sum + rung.count, 0)).toBe(overview.totalConcepts);
    expect(new Set(overview.ladder.flatMap(rung => rung.concepts.map(item => item.stableId))).size).toBe(2);
  });
});

describe("XP and level", () => {
  it("measures the level bar from the current level, not from zero", () => {
    expect(calculateRank(100)).toMatchObject({ label: "Em movimento", currentXp: 100, startsAt: 60, nextRankAt: 140, nextLabel: "Ritmo de estudo" });
    expect(calculateRank(0)).toMatchObject({ startsAt: 0, nextRankAt: 60 });
  });
  it("names every XP reason for the student and never shows the stored code", () => {
    expect(xpReasonLabel("question_independent_success")).toBe("Acertou de primeira, sem ajuda");
    expect(xpReasonLabel("question_assisted_success")).toBe("Acertou depois de revisar");
    expect(xpReasonLabel("something_new")).toBe("Prática registrada");
  });
});
