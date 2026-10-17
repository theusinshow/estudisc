import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMemoryStore } from "@/db/repositories/memory/store";
import { canAccessActivity, findActivityLessonStableIds } from "@/features/payments/activity-access";

const mocks = vi.hoisted(() => ({ full: false, execute: vi.fn(), interact: vi.fn(), plan: vi.fn(), transition: vi.fn() }));
vi.mock("@/features/payments/access-guard", async (original) => ({
  ...(await original<object>()),
  resolveAccessState: async () => ({ hasFullAccess: mocks.full, source: mocks.full ? "mercadopago" : "free_preview", entitlement: null, sampleLessonIds: [] })
}));
vi.mock("@/features/auth/owner", async (original) => ({ ...(await original<object>()), getOwnerId: async () => "owner-free" }));
vi.mock("@/features/ai/server", () => ({ executeLearningAi: mocks.execute }));
vi.mock("@/features/study-sessions/api", () => ({ studySessionRepository: () => ({ plan: mocks.plan, transition: mocks.transition }) }));
vi.mock("@/db/repositories/memory-question-study-repository", () => ({ MemoryQuestionStudyRepository: class { interact = mocks.interact; } }));
vi.mock("@/db/repositories/question-study-repository", async (original) => ({ ...(await original<object>()), QuestionStudyRepository: class { interact = mocks.interact; } }));

const { POST: tutor } = await import("@/app/api/tutor/route");
const { POST: studySessions } = await import("@/app/api/study-sessions/route");
const { POST: question } = await import("@/app/api/activities/[activityId]/question/route");

const json = (url: string, body: unknown) => new Request(`http://localhost${url}`, { method: "POST", body: JSON.stringify(body) });
const answer = (activityId: string) =>
  question(json(`/api/activities/${activityId}/question`, { questionId: "q", questionVersion: 1, action: "submit", submissionKey: crypto.randomUUID(), response: "A" }), {
    params: Promise.resolve({ activityId })
  });

function seedTrack() {
  getMemoryStore().packImports = [
    {
      manifest: {
        schema: "caderno.track.v2",
        track: {
          modules: [
            {
              lessons: [
                { id: "MAT-07", activities: [{ id: "MAT-07-Q01" }] },
                { id: "MAT-08", activities: [{ id: "MAT-08-Q01" }] }
              ]
            }
          ]
        }
      }
    }
  ] as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.full = false;
  seedTrack();
  mocks.execute.mockResolvedValue({ text: "Pista.", source: "ai", cached: false, assisted: true });
  mocks.interact.mockResolvedValue({ ok: true });
  mocks.plan.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111", status: "PLANNED" });
  mocks.transition.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111", status: "ACTIVE" });
});

describe("free preview gating (ADR 0061 §3)", () => {
  it("only opens activities whose every lesson is a free sample", async () => {
    const lookup = async (id: string) => ({ a: ["MAT-07"], b: ["MAT-08"], mixed: ["MAT-07", "MAT-08"], unknown: [] })[id] ?? [];
    expect(await canAccessActivity("a", { hasFullAccess: false }, lookup)).toBe(true);
    expect(await canAccessActivity("b", { hasFullAccess: false }, lookup)).toBe(false);
    expect(await canAccessActivity("mixed", { hasFullAccess: false }, lookup)).toBe(false);
    expect(await canAccessActivity("unknown", { hasFullAccess: false }, lookup)).toBe(true);
    expect(await canAccessActivity("b", { hasFullAccess: true }, async () => { throw new Error("not consulted"); })).toBe(true);
    expect(await findActivityLessonStableIds("MAT-08-Q01")).toEqual(["MAT-08"]);
  });

  it("blocks the legacy tutor route without full access, so free accounts never reach the AI provider", async () => {
    const legacy = { activityId: "a", questionId: "q", questionVersion: 1, mode: "SOCRATIC", message: "Como começar?" };
    const blocked = await tutor(json("/api/tutor", legacy));
    expect(blocked.status).toBe(403);
    expect(await blocked.json()).toMatchObject({ code: "paid_access_required" });
    expect(mocks.execute).not.toHaveBeenCalled();
    mocks.full = true;
    expect((await tutor(json("/api/tutor", legacy))).status).toBe(200);
  });

  it("blocks planning new study sessions but still lets an existing session be started or closed", async () => {
    for (const body of [{ action: "plan", budgetMinutes: 15 }]) {
      const response = await studySessions(json("/api/study-sessions", body));
      expect(response.status).toBe(403);
    }
    expect(mocks.plan).not.toHaveBeenCalled();
    const start = await studySessions(json("/api/study-sessions", { action: "start", sessionId: "11111111-1111-4111-8111-111111111111" }));
    expect(start.status).toBe(200);
    expect(mocks.transition).toHaveBeenCalled();
  });

  it("answers questions from free sample lessons and refuses the rest", async () => {
    expect((await answer("MAT-07-Q01")).status).toBe(200);
    const locked = await answer("MAT-08-Q01");
    expect(locked.status).toBe(403);
    expect(await locked.json()).toMatchObject({ code: "paid_access_required" });
    expect(mocks.interact).toHaveBeenCalledTimes(1);
    mocks.full = true;
    expect((await answer("MAT-08-Q01")).status).toBe(200);
  });
});
