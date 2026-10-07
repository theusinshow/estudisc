import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/study-plan/route";
import { RoutineConflictError } from "@/features/study-sessions/routine-contracts";

const mocks = vi.hoisted(() => ({ owner: vi.fn(), getState: vi.fn(), preview: vi.fn(), apply: vi.fn() }));
vi.mock("@/features/auth/owner", () => ({ getOwnerId: mocks.owner, AccessDeniedError: class extends Error {} }));
vi.mock("@/features/study-sessions/routine-api", () => ({ studyPlanRepository: () => mocks }));
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("FEATURE_STUDY_PLANNER", "true"); mocks.owner.mockResolvedValue("authenticated-owner"); });
afterEach(() => vi.unstubAllEnvs());

it("hides disabled rollout without invoking persistence", async () => {
  vi.stubEnv("FEATURE_STUDY_PLANNER", "false");
  expect((await GET()).status).toBe(404);
  expect((await POST(new Request("http://localhost/api/study-plan", { method: "POST" }))).status).toBe(404);
  expect(mocks.owner).not.toHaveBeenCalled();
});
it("uses only the authenticated owner, validates strict actions and returns private responses", async () => {
  mocks.getState.mockResolvedValue({ routine: null, subjects: [], week: null });
  const read = await GET();
  expect(read.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.getState).toHaveBeenCalledWith("authenticated-owner");
  const id = crypto.randomUUID();
  const request = (body: unknown) => new Request("http://localhost/api/study-plan", { method: "POST", body: JSON.stringify(body) });
  expect((await POST(request({ action: "apply", previewId: id, ownerId: "another-owner" }))).status).toBe(400);
  expect(mocks.apply).not.toHaveBeenCalled();
  mocks.apply.mockRejectedValue(new RoutineConflictError("stale_preview"));
  const stale = await POST(request({ action: "apply", previewId: id }));
  expect(stale.status).toBe(409);
  expect(mocks.apply).toHaveBeenCalledWith("authenticated-owner", id);
  expect(await stale.json()).toMatchObject({ code: "stale_preview" });
});
it("rejects invalid/oversized input without saving settings or exposing raw errors", async () => {
  expect((await POST(new Request("http://localhost/api/study-plan", { method: "POST", body: "{" }))).status).toBe(400);
  expect((await POST(new Request("http://localhost/api/study-plan", { method: "POST", body: "x".repeat(32_769) }))).status).toBe(413);
  expect(mocks.preview).not.toHaveBeenCalled(); expect(mocks.apply).not.toHaveBeenCalled();
});
