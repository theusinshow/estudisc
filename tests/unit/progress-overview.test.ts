import { describe, expect, it } from "vitest";

import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";
import { buildProgressOverview, studyActivityDates } from "@/features/progress/overview";

// 2026-10-01 is a Thursday; 15:00Z is midday in São Paulo.
const now = new Date("2026-10-01T15:00:00Z");

it("does not count routine configuration, schema operations or AI reservations as a study day", () => {
  const eventDates = studyActivityDates(["study_plan_applied","evolution_schema_activation","ai_request"].map(type=>({type,occurredAt:now})));
  expect(buildProgressOverview({ concepts: [], evidence: [], eventDates, now }).activeDaysThisWeek).toBe(0);
  expect(studyActivityDates([{ type: "study_plan_applied", occurredAt: now }, { type: "review_reflection", occurredAt: now }])).toEqual([now]);
});

const concepts = [
  { stableId: "fractions", title: "Frações", areaTitles: ["Matemática"] },
  { stableId: "ratios", title: "Razões", areaTitles: ["Matemática"] },
  { stableId: "atoms", title: "Átomos", areaTitles: ["Ciências"] },
  { stableId: "commas", title: "Vírgulas", areaTitles: ["Português"] }
];

function evidence(conceptStableId: string, createdAt: Date, questionId: string, outcome = "passed"): ConceptEvidenceRecord {
  return {
    id: `${conceptStableId}-${questionId}-${createdAt.toISOString()}`,
    conceptStableId,
    type: "question_result",
    strength: 100,
    sourceType: "attempt",
    sourceId: questionId,
    attemptId: null,
    createdAt,
    conditions: { policyVersion: "mastery.v2", outcome, hintLevel: 0, solutionRevealed: false, questionId, difficulty: "direct", delayedRetrieval: false, transfer: false }
  };
}

describe("buildProgressOverview", () => {
  it("places every concept on exactly one rung using the versioned mastery policy", () => {
    const overview = buildProgressOverview({
      concepts,
      evidence: [
        evidence("fractions", new Date("2026-09-30T15:00:00Z"), "q1"),
        evidence("fractions", new Date("2026-10-01T14:00:00Z"), "q2"),
        evidence("atoms", new Date("2026-10-01T14:00:00Z"), "q3")
      ],
      eventDates: [],
      now
    });

    const counts = Object.fromEntries(overview.ladder.map((rung) => [rung.state, rung.count]));
    expect(counts).toEqual({ unseen: 2, introduced: 0, understood: 1, practicing: 1, strong: 0, mastered: 0 });
    expect(overview.ladder.reduce((sum, rung) => sum + rung.count, 0)).toBe(concepts.length);
    expect(overview.conceptsWithEvidence).toBe(2);
    expect(overview.practicingOrAbove).toBe(1);
  });

  it("lists cooling concepts by lowest retention and ignores concepts without evidence", () => {
    const overview = buildProgressOverview({
      concepts,
      evidence: [
        evidence("fractions", new Date("2026-09-20T15:00:00Z"), "q1"),
        evidence("atoms", new Date("2026-09-29T15:00:00Z"), "q3"),
        evidence("ratios", new Date("2026-10-01T14:00:00Z"), "q4")
      ],
      eventDates: [],
      now
    });

    expect(overview.cooling.map((concept) => concept.stableId)).toEqual(["fractions", "atoms"]);
    expect(overview.cooling[0].retention).toBeLessThan(overview.cooling[1].retention);
    expect(overview.cooling.every((concept) => concept.reason === "fading")).toBe(true);
  });

  it("flags a recent miss after a success, and never lists concepts without an independent success", () => {
    const overview = buildProgressOverview({
      concepts,
      evidence: [
        evidence("ratios", new Date("2026-10-01T12:00:00Z"), "q1"),
        evidence("ratios", new Date("2026-10-01T13:00:00Z"), "q2", "failed"),
        evidence("commas", new Date("2026-10-01T13:00:00Z"), "q3", "failed")
      ],
      eventDates: [],
      now
    });

    expect(overview.cooling).toEqual([expect.objectContaining({ stableId: "ratios", reason: "missed" })]);
  });

  it("counts answered attempts as study even without a study event", () => {
    const overview = buildProgressOverview({ concepts, evidence: [{ ...evidence("fractions", now, "q1"), attemptId: "a1" }, { ...evidence("ratios", now, "q1"), attemptId: "a1" }], eventDates: [], now });

    expect(overview.activity.at(-1)?.count).toBe(1);
    expect(overview.activeDaysThisWeek).toBe(1);
  });

  it("averages mastery levels per area including unseen concepts", () => {
    const overview = buildProgressOverview({ concepts, evidence: [evidence("fractions", now, "q1")], eventDates: [], now });
    const math = overview.areas.find((area) => area.title === "Matemática");

    expect(overview.areas.map((area) => area.title)).toEqual(["Ciências", "Matemática", "Português"]);
    expect(math).toMatchObject({ conceptCount: 2, practicedCount: 1, averageLevel: 1 });
  });

  it("counts study days in the São Paulo calendar on a Sunday-aligned grid without future days", () => {
    const overview = buildProgressOverview({
      concepts: [],
      evidence: [],
      // 02:00Z on Oct 1 is still Sep 30 in São Paulo.
      eventDates: [new Date("2026-10-01T02:00:00Z"), new Date("2026-09-30T20:00:00Z"), new Date("2026-10-01T13:00:00Z"), new Date("2026-08-01T12:00:00Z")],
      now
    });

    expect(overview.activity[0].weekday).toBe(0);
    expect(overview.activity.at(-1)).toMatchObject({ date: "2026-10-01", isToday: true, count: 1 });
    expect(overview.activity.find((day) => day.date === "2026-09-30")?.count).toBe(2);
    expect(overview.activeDaysLast28).toBe(2);
    expect(overview.week.map((day) => day.date)).toEqual(["2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(overview.week.filter((day) => day.isFuture)).toHaveLength(2);
    expect(overview.activeDaysThisWeek).toBe(2);
  });
});
