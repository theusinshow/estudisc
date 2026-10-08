import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError } from "@/features/auth/owner";
import { TargetedPracticeError } from "@/features/study-sessions/targeted-selection";
import { POST as plan } from "@/app/api/study-sessions/route";
import { POST as reflect } from "@/app/api/mistakes/reflection/route";

const mocks = vi.hoisted(() => ({ owner: vi.fn(), plan: vi.fn(), reflection: vi.fn(), enabled: true }));
vi.mock("@/features/auth/owner", async original => ({ ...await original<object>(), getOwnerId: mocks.owner }));
vi.mock("@/features/study-sessions/api", () => ({ studySessionRepository: () => ({ plan: mocks.plan }) }));
vi.mock("@/features/mistakes/api", () => ({ recordMistakeReflection: mocks.reflection }));
vi.mock("@/lib/feature-flags", async original => ({ ...await original<object>(), getFeatureFlags: () => ({ FEATURE_SMART_MISTAKES: mocks.enabled, FEATURE_ADAPTIVE_SESSION: false }) }));
const id = "70000000-0000-4000-8000-000000000001";
const request = (data: unknown) => new Request("http://localhost/api", { method: "POST", body: JSON.stringify(data) });

describe("targeted retrieval and reflection HTTP boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.enabled = true;
    mocks.owner.mockResolvedValue("authenticated-owner");
    mocks.plan.mockResolvedValue({ id, status: "PLANNED" });
    mocks.reflection.mockResolvedValue(id);
  });
  it("resolves targets for the authenticated owner without accepting client selection or impersonation", async () => {
    expect((await plan(request({ action: "practice_mistake", budgetMinutes: 15, mistakeId: id }))).status).toBe(200);
    expect(mocks.plan).toHaveBeenCalledWith("authenticated-owner", 15, expect.any(Date), { kind: "remediation", mistakeId: id });
    expect((await plan(request({ action: "quick_review", budgetMinutes: 10, conceptId: "MAT.X" }))).status).toBe(200);
    expect(mocks.plan).toHaveBeenLastCalledWith("authenticated-owner", 10, expect.any(Date), { kind: "review", conceptId: "MAT.X" });
    mocks.plan.mockClear();
    for (const extra of [{ ownerId: "other" }, { conceptIds: ["MAT.X"] }, { excludedQuestionIds: [] }]) {
      expect((await plan(request({ action: "quick_review", budgetMinutes: 10, ...extra }))).status).toBe(400);
    }
    expect((await plan(request({ action: "quick_review", budgetMinutes: 30 }))).status).toBe(400);
    expect(mocks.plan).not.toHaveBeenCalled();
  });
  it("fails closed for foreign targets, active exams and no eligible alternate", async () => {
    mocks.plan.mockRejectedValueOnce(new TargetedPracticeError("target_unavailable"));
    expect((await plan(request({ action: "practice_mistake", budgetMinutes: 10, mistakeId: id }))).status).toBe(404);
    mocks.plan.mockRejectedValueOnce(new TargetedPracticeError("exam_active"));
    expect((await plan(request({ action: "quick_review", budgetMinutes: 10 }))).status).toBe(409);
    mocks.plan.mockResolvedValueOnce(null);
    const missing = await plan(request({ action: "practice_mistake", budgetMinutes: 10, mistakeId: id }));
    expect(missing.status).toBe(409); expect(await missing.json()).toMatchObject({ code: "content_gap" });
  });
  it("keeps both new entry points off before rollout and preserves legacy budget gating", async () => {
    mocks.enabled = false;
    expect((await plan(request({ action: "quick_review", budgetMinutes: 10 }))).status).toBe(404);
    expect((await reflect(request({}))).status).toBe(404);
    expect((await plan(request({ action: "plan", budgetMinutes: 10 }))).status).toBe(400);
    expect(mocks.owner).not.toHaveBeenCalled(); expect(mocks.reflection).not.toHaveBeenCalled();
  });
  it("records only a validated student report and rejects invented evidence or unsupported diagnoses", async () => {
    const payload = { mistakeId: id, mutationId: id, category: "calculation_error", note: "Minha percepção." };
    const result = await reflect(request(payload));
    expect(result.status).toBe(200); expect(await result.json()).toMatchObject({ basis: "student_report", canonicalEvidence: false });
    expect(mocks.reflection).toHaveBeenCalledWith(payload);
    mocks.reflection.mockClear();
    for (const data of [{ ...payload, canonicalEvidence: true }, { ...payload, ownerId: "other" }, { ...payload, category: "diagnosed_by_ai" }, { ...payload, note: "x".repeat(1001) }]) {
      expect((await reflect(request(data))).status).toBe(400);
    }
    expect(mocks.reflection).not.toHaveBeenCalled();
  });
  it("maps authorization, missing-record and idempotency conflicts without writing a substitute record", async () => {
    const payload = { mistakeId: id, mutationId: id, category: "attention_error" };
    mocks.owner.mockRejectedValueOnce(new AccessDeniedError());
    expect((await plan(request({ action: "quick_review", budgetMinutes: 10 }))).status).toBe(403);
    for (const [error, status] of [[new AccessDeniedError(), 403], [new Error("Mistake unavailable"), 404], [new Error("Reflection conflict"), 409]] as const) {
      mocks.reflection.mockRejectedValueOnce(error); expect((await reflect(request(payload))).status).toBe(status);
    }
  });
});
