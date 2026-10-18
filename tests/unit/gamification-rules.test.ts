import { describe, expect, it } from "vitest";
import { attachGamificationPersistence, buildGamificationSummary } from "@/features/gamification/gamification-rules";
import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";

const now = new Date("2026-10-02T18:00:00Z");
const base = { xp: { totalXp: 0, transactions: [] }, dueReviews: [], mistakes: [], now };
function answer(id: string, questionId = id, conditions: Record<string, unknown> = {}, createdAt = now): ConceptEvidenceRecord {
  return { id, attemptId: id, conceptStableId: "MAT.TEST", type: "question_result", strength: 2, sourceType: "question_attempt", sourceId: id, createdAt,
    conditions: { questionId, outcome: "passed", hintLevel: 0, solutionRevealed: false, ...conditions } };
}

describe("study gamification", () => {
  it("adds the 2026-10-18 achievements from the same records, without XP", () => {
    const day = (n: number) => new Date(Date.UTC(2026, 8, n, 15));
    const ladder = Array.from({ length: 50 }, (_, index) => answer(`s${index}`, `q${index}`, {}, day(1 + (index % 10))));
    const subjects = ["POR", "CIE", "GH"].map(code => ({ ...answer(`sub-${code}`, `q-${code}`), conceptStableId: `${code}.TEST` }));
    const exam = ["e1", "e2", "e3", "e4", "e5"].map(id => answer(id, id, { difficulty: id === "e5" ? "challenge" : "ifsc" }));
    const simulado = { ...answer("sim-1", "q-sim", { assessmentId: "inst-1", mode: "assessment" }), type: "assessment_result" };
    const reviews = ["r1", "r2", "r3", "r4", "r5"].map(id => answer(id, id, { delayedRetrieval: true }));
    const comebacks = ["c1", "c2", "c3"].flatMap(id => [answer(`${id}-fail`, id, { outcome: "failed" }, day(20)), answer(`${id}-fix`, id, {}, day(21))]);
    const summary = buildGamificationSummary({ ...base, evidence: [...ladder, ...subjects, ...exam, simulado, ...reviews, ...comebacks] });
    const earned = (id: string) => summary.badges.find(badge => badge.id === id)?.earned;
    for (const id of ["study-practice-fifty", "study-all-subjects", "first-simulado", "exam-level-five", "returned-stronger-five", "study-steady-ten", "study-comeback-three"]) expect(earned(id), id).toBe(true);
    expect(summary.rank.currentXp).toBe(0);
  });

  it("keeps the new achievements locked below their thresholds or with help", () => {
    const summary = buildGamificationSummary({ ...base, evidence: [
      answer("a", "q1"), { ...answer("b", "q2", { hintLevel: 1 }), conceptStableId: "POR.TEST" },
      answer("x1", "x1", { difficulty: "ifsc", solutionRevealed: true }), answer("x2", "x2", { difficulty: "applied" })
    ] });
    const badge = (id: string) => summary.badges.find(item => item.id === id);
    expect(badge("study-all-subjects")).toMatchObject({ current: 1, target: 4, earned: false });
    expect(badge("exam-level-five")).toMatchObject({ current: 0, earned: false });
    expect(badge("first-simulado")).toMatchObject({ current: 0, earned: false });
    expect(badge("study-steady-ten")).toMatchObject({ current: 1, earned: false });
  });

  it("does not award anything for an empty queue or page visits", () => {
    const summary = buildGamificationSummary(base);
    expect(summary.badges.every(badge => !badge.earned)).toBe(true);
    expect(summary.missions.every(mission => mission.status === "available")).toBe(true);
    expect(summary.week.activeDays).toBe(0);
    expect(summary.rank).toMatchObject({ label: "Explorador", nextRankAt: 60, startsAt: 0 });
  });

  it("recognizes independent answers across subjects, deduplicating Concepts, retries and versions", () => {
    const first = answer("a", "q1");
    const evidence = [first, { ...first, id: "another-concept", conceptStableId: "POR.TEST" },
      answer("retry", "q1", { questionVersion: 2 }), ...["q2", "q3", "q4", "q5"].map(id => answer(id))];
    const summary = buildGamificationSummary({ ...base, evidence });
    expect(summary.badges.find(badge => badge.id === "study-practice-five")).toMatchObject({ current: 5, earned: true });
    expect(summary.badges.find(badge => badge.id === "study-practice-twenty")).toMatchObject({ current: 5, earned: false });
    expect(summary.rank.currentXp).toBe(0); // Badges never manufacture XP or mastery.
  });

  it("counts failed and assisted answers for attendance but not independent success", () => {
    const summary = buildGamificationSummary({ ...base, evidence: [
      answer("wrong", "q1", { outcome: "failed" }), answer("hint", "q2", { hintLevel: 1 }),
      answer("solution", "q3", { solutionRevealed: true }), answer("missing", "q4", { hintLevel: undefined }),
      { ...answer("seed"), type: "diagnostic_result" }, { ...answer("reflection"), type: "delayed_review_result", attemptId: null }
    ] });
    expect(summary.badges.find(badge => badge.id === "first-submit")?.earned).toBe(false);
    expect(summary.missions[0].status).toBe("complete");
    expect(summary.week.activeDays).toBe(1);
  });

  it("requires independent delayed retrieval, never an empty review queue or self-rating", () => {
    const summary = buildGamificationSummary({ ...base, evidence: [
      answer("hinted", "q1", { delayedRetrieval: true, hintLevel: 1 }),
      { ...answer("reflection", "q2", { delayedRetrieval: true }), type: "delayed_review_result" },
      answer("fresh", "q3", { delayedRetrieval: false })
    ] });
    expect(summary.badges.find(badge => badge.id === "returned-stronger")?.earned).toBe(false);
    const earned = buildGamificationSummary({ ...base, evidence: [answer("retrieval", "q4", { delayedRetrieval: true })] });
    expect(earned.badges.find(badge => badge.id === "returned-stronger")?.earned).toBe(true);
    expect(earned.missions.find(mission => mission.id === "study-retrieval")?.status).toBe("complete");
  });

  it("only celebrates a correction after failure on the same stable Question", () => {
    const failed = answer("wrong", "q1", { outcome: "failed" }, new Date("2026-10-01T12:00:00Z"));
    const unrelated = buildGamificationSummary({ ...base, evidence: [failed, answer("other", "q2")] });
    expect(unrelated.badges.find(badge => badge.id === "study-comeback")?.earned).toBe(false);
    const helped = buildGamificationSummary({ ...base, evidence: [failed, answer("hint", "q1", { hintLevel: 1 })] });
    expect(helped.badges.find(badge => badge.id === "study-comeback")?.earned).toBe(false);
    const corrected = buildGamificationSummary({ ...base, evidence: [answer("right", "q1"), failed] });
    expect(corrected.badges.find(badge => badge.id === "study-comeback")?.earned).toBe(true);
    const wrongAfter = buildGamificationSummary({ ...base, evidence: [answer("first", "q1", {}, new Date("2026-09-30T12:00:00Z")), failed] });
    expect(wrongAfter.badges.find(badge => badge.id === "study-comeback")?.earned).toBe(false);
  });

  it("uses Monday-Sunday in São Paulo and allows nonconsecutive days, ignoring future evidence", () => {
    const summary = buildGamificationSummary({ ...base, evidence: [
      answer("prev", "q1", {}, new Date("2026-09-28T01:00:00Z")), // Local Sunday.
      answer("mon", "q2", { outcome: "failed" }, new Date("2026-09-28T12:00:00Z")),
      answer("wed", "q3", {}, new Date("2026-09-30T12:00:00Z")),
      answer("fri", "q4"), answer("future", "q5", {}, new Date("2026-10-05T12:00:00Z"))
    ] });
    expect(summary.week).toMatchObject({ startsOn: "2026-09-28", activeDays: 3, targetDays: 3 });
    expect(summary.week.days.map(day => day.active)).toEqual([true, false, true, false, true, false, false]);
    expect(summary.badges.find(badge => badge.id === "study-steady-three")?.earned).toBe(true);
    expect(summary.badges.find(badge => badge.id === "study-practice-five")?.current).toBe(3);
    const nextWeek = buildGamificationSummary({ ...base, now: new Date("2026-10-05T12:00:00Z"), evidence: [answer("old", "q1")] });
    expect(nextWeek.week.activeDays).toBe(0);
    expect(nextWeek.missions.at(-1)?.id).toBe("study-week:2026-10-05");
    expect(nextWeek.badges.find(badge => badge.id === "first-submit")?.earned).toBe(true);
  });

  it("shows Portuguese ranks at the existing thresholds and separates Lab history", () => {
    const summary = buildGamificationSummary({ ...base, xp: { totalXp: 140, transactions: [
      { id: "xp1", amount: 80, reason: "debug_activity_passed", sourceType: "attempt", sourceId: "a", createdAt: now }
    ] } });
    expect(summary.rank).toMatchObject({ label: "Ritmo de estudo", startsAt: 140, nextRankAt: 300, nextLabel: "Foco em ação" });
    expect(summary.badges.find(badge => badge.id === "debugger")).toMatchObject({ earned: true, category: "legacy" });
    expect(buildGamificationSummary({ ...base, xp: { totalXp: 500, transactions: [] } }).rank.nextRankAt).toBeNull();
  });

  it("preserves awarded dates and historical criteria without reawarding or relocking", () => {
    const createdAt = new Date("2026-08-01T12:00:00Z");
    const award = { label: "Debugger", criteriaSnapshot: "Approve debug", sourceType: "gamification_rule", sourceId: "gamification.v1:debugger", createdAt };
    const summary = attachGamificationPersistence(buildGamificationSummary(base), {
      badgeAwards: [{ ...award, badgeId: "debugger" }, { ...award, badgeId: "first-submit" }], missionProgress: [], missionEvents: []
    });
    expect(summary.badges.find(badge => badge.id === "first-submit")).toMatchObject({ earned: true, awardedAt: createdAt });
    expect(summary.badges.find(badge => badge.id === "debugger")).toMatchObject({ category: "legacy", criteria: "Approve debug", awardedAt: createdAt });
  });
});
