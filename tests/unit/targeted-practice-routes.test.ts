import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError } from "@/features/auth/owner";
import { TargetedPracticeError } from "@/features/study-sessions/targeted-selection";
import { POST as post } from "@/app/api/study-sessions/route";
import { POST as reflect } from "@/app/api/mistakes/reflection/route";

const mocks = vi.hoisted(() => ({ owner: vi.fn(), startBlock: vi.fn(), reflection: vi.fn(), enabled: true }));
vi.mock("@/features/auth/owner", async original => ({ ...await original<object>(), getOwnerId: mocks.owner }));
vi.mock("@/features/study-sessions/api", () => ({ studySessionRepository: () => ({ startBlock: mocks.startBlock }) }));
vi.mock("@/features/mistakes/api", () => ({ recordMistakeReflection: mocks.reflection }));
vi.mock("@/lib/feature-flags", async original => ({ ...await original<object>(), getFeatureFlags: () => ({ FEATURE_SMART_MISTAKES: mocks.enabled }) }));
const id = "70000000-0000-4000-8000-000000000001";
const request = (data: unknown) => new Request("http://localhost/api", { method: "POST", body: JSON.stringify(data) });
const block = (target: unknown) => request({ action: "practice_block", target });

describe("practice block and reflection HTTP boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.enabled = true;
    mocks.owner.mockResolvedValue("authenticated-owner");
    mocks.startBlock.mockResolvedValue({ id, status: "ACTIVE" });
    mocks.reflection.mockResolvedValue(id);
  });
  it("starts a block for the authenticated owner's target without accepting client selection, time or impersonation", async () => {
    expect((await post(block({ kind: "remediation", mistakeId: id }))).status).toBe(200);
    expect(mocks.startBlock).toHaveBeenCalledWith("authenticated-owner", { kind: "remediation", mistakeId: id });
    expect((await post(block({ kind: "review", conceptId: "MAT.X" }))).status).toBe(200);
    expect(mocks.startBlock).toHaveBeenLastCalledWith("authenticated-owner", { kind: "review", conceptId: "MAT.X" });
    const started = await post(block({ kind: "review" }));
    expect(await started.json()).toEqual({ sessionId: id, status: "ACTIVE" });
    mocks.startBlock.mockClear();
    for (const data of [
      { action: "practice_block", target: { kind: "review" }, ownerId: "other" },
      { action: "practice_block", target: { kind: "review", conceptIds: ["MAT.X"] } },
      { action: "practice_block", target: { kind: "review", excludedQuestionIds: [] } },
      { action: "practice_block", target: { kind: "review" }, budgetMinutes: 10 },
      { action: "practice_block", target: { kind: "remediation", mistakeId: "nope" } },
      { action: "quick_review", budgetMinutes: 10 },
      { action: "practice_mistake", budgetMinutes: 10, mistakeId: id },
      { action: "plan", budgetMinutes: 15 },
      { action: "start", sessionId: id }
    ]) expect((await post(request(data))).status).toBe(400);
    expect(mocks.startBlock).not.toHaveBeenCalled();
  });
  it("fails closed for foreign targets, active exams and no eligible Question", async () => {
    mocks.startBlock.mockRejectedValueOnce(new TargetedPracticeError("target_unavailable"));
    expect((await post(block({ kind: "remediation", mistakeId: id }))).status).toBe(404);
    mocks.startBlock.mockRejectedValueOnce(new TargetedPracticeError("exam_active"));
    const exam = await post(block({ kind: "review" }));
    expect(exam.status).toBe(409); expect(await exam.json()).toMatchObject({ code: "exam_active", message: "Termine o simulado antes de praticar." });
    mocks.startBlock.mockResolvedValueOnce(null);
    const missing = await post(block({ kind: "review", conceptId: "MAT.X" }));
    expect(missing.status).toBe(409);
    expect(await missing.json()).toMatchObject({ code: "content_gap", message: "Sem questões novas para este conceito agora. Volte amanhã ou revise a aula." });
    mocks.startBlock.mockResolvedValueOnce(null);
    expect(await (await post(block({ kind: "review" }))).json()).toMatchObject({ message: "Sem questões novas para revisar agora. Volte amanhã ou revise a aula." });
  });
  it("keeps practice blocks and reflections off before rollout", async () => {
    mocks.enabled = false;
    expect((await post(block({ kind: "review" }))).status).toBe(404);
    expect((await reflect(request({}))).status).toBe(404);
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
    expect((await post(block({ kind: "review" }))).status).toBe(403);
    for (const [error, status] of [[new AccessDeniedError(), 403], [new Error("Mistake unavailable"), 404], [new Error("Reflection conflict"), 409]] as const) {
      mocks.reflection.mockRejectedValueOnce(error); expect((await reflect(request(payload))).status).toBe(status);
    }
  });
});
