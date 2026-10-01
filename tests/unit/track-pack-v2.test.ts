import { expect, it } from "vitest";
import example from "../../packs/examples/ifsc-2027.minimal.track.v2.json";
import v1 from "../../packs/examples/javascript-fundamentals.track.json";
import { validateTrackPack, trackPackV2Schema } from "@/features/import/api";
import { canExposeQuestion, evaluateQuestion } from "@/features/questions/api";

it("keeps v1 behavior, validates v2 references and rejects unregistered interactions", () => {
  expect(validateTrackPack(v1).ok).toBe(true);
  expect(trackPackV2Schema.safeParse(example).success).toBe(true);
  expect(validateTrackPack(example).ok).toBe(false); // numeric-explorer/question are introduced in IFSC-03.
  const candidate = structuredClone(example);
  candidate.track.modules[0].lessons[0].blocks = [];
  candidate.track.modules[0].lessons[0].activities = [];
  expect(validateTrackPack(candidate).ok).toBe(true);
  candidate.curriculumRequirements[0].mappedConceptIds.push("missing");
  expect(validateTrackPack(candidate).ok).toBe(false);
});

it("scores numeric deterministically and enforces protected/annulled exposure", () => {
  const question = trackPackV2Schema.parse(example).questions[0];
  expect(evaluateQuestion(question, "30,0").correct).toBe(true);
  expect(evaluateQuestion(question, "").correct).toBe(false);
  expect(evaluateQuestion({ ...question, status: "annulled" }, 30)).toMatchObject({ score: 0, evidenceEligible: false });
  const protectedQuestion = { ...question, status: "published" as const, provenance: { type: "official_exam" as const, examId: "benchmark", officialNumber: 1 }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: true } };
  expect(canExposeQuestion(protectedQuestion, { now: new Date("2026-10-01"), context: "training" })).toBe(false);
  expect(canExposeQuestion(protectedQuestion, { now: new Date("2026-10-01"), context: "assessment", authorizedExamId: "another" })).toBe(false);
  expect(canExposeQuestion(protectedQuestion, { now: new Date("2026-10-01"), context: "assessment", authorizedExamId: "benchmark" })).toBe(true);
});
