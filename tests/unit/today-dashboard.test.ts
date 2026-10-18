import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTodayDashboard } from "@/features/today/get-today-dashboard";
import { buildRecommendations } from "@/features/recommendations/recommendation-rules";

const mocks = vi.hoisted(() => ({ inputs: vi.fn(), progress: vi.fn(), lessons: vi.fn() }));
vi.mock("@/features/auth/owner", () => ({ getOwnerProfile: async () => ({ ownerId: "owner", role: "STUDENT" }) }));
vi.mock("@/db/connection", () => ({ getDatabaseUrl: () => "memory://local" }));
vi.mock("@/features/recommendations/api", () => ({ getRecommendationInputs: mocks.inputs }));
vi.mock("@/features/progress/api", () => ({ getProgressOverview: mocks.progress }));
vi.mock("@/features/recommendations/lesson-candidates", () => ({ listRecommendationLessons: mocks.lessons }));
const { flow } = vi.hoisted(() => ({ flow: vi.fn(async () => ({ next: { lesson: { id: "MAT-02", title: "Divisibilidade", subjectCode: "MAT", order: 2, estimatedMinutes: 40, questionIds: ["q"] }, resume: false }, bySubject: [] })) }));
vi.mock("@/features/study-flow/api", () => ({ getStudyFlow: flow }));

describe("Today dashboard coordinator", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());
  it("always loads the continuous study flow and never reads or creates sessions", async () => {
    mocks.inputs.mockResolvedValue({ dueReviews: [], mistakes: [], tracks: [], projects: [] });
    mocks.progress.mockResolvedValue({ ladder: [], cooling: [], week: [] });
    mocks.lessons.mockResolvedValue([]);
    const dashboard = await getTodayDashboard(new Date("2026-10-06T15:00:00Z"));
    expect(dashboard.flow.next?.lesson.id).toBe("MAT-02");
    expect(flow).toHaveBeenCalledWith("owner");
    expect(dashboard).not.toHaveProperty("sessions");
    expect(dashboard).not.toHaveProperty("routine");
    expect(dashboard.nextAction?.href ?? "").not.toMatch(/^\/study\//);
    for (const reader of Object.values(mocks)) expect(reader).toHaveBeenCalledTimes(1);
  });
  it("prioritizes active session, due review, interrupted lesson and prerequisites before new learning", () => {
    const base = { title: "Lesson", subjectCode: "POR", estimatedMinutes: 30, importance: 2, activityCount: 8, passed: 0 };
    const result = buildRecommendations({ sessions: [{ id: "active", status: "ACTIVE" }], dueReviews: [], mistakes: [], tracks: [], lessons: [
      { ...base, id: "new", prerequisiteIds: [], attempted: 0 },
      { ...base, id: "interrupted", prerequisiteIds: [], attempted: 2 },
      { ...base, id: "blocked", prerequisiteIds: ["prerequisite"], attempted: 0 }
    ] });
    expect(result.map(row => row.id)).toEqual(["session:active", "lesson:interrupted", "prerequisite:blocked", "lesson:new"]);
    expect(result.every(row => row.reason.length > 20)).toBe(true);
  });
  it("keeps a full catalog from turning Today into a lesson directory", async () => {
    mocks.inputs.mockResolvedValue({ dueReviews: [], mistakes: [], tracks: [], projects: [] });
    mocks.progress.mockResolvedValue({ ladder: [], cooling: [], week: [] });
    mocks.lessons.mockResolvedValue(Array.from({ length: 132 }, (_, index) => ({
      id: `lesson-${String(index).padStart(3, "0")}`, title: `Lesson ${index}`, subjectCode: "POR", estimatedMinutes: 30,
      importance: 2, activityCount: 8, attempted: 0, passed: 0, prerequisiteIds: []
    })));
    const dashboard = await getTodayDashboard();
    expect(dashboard.nextAction?.href).toMatch(/^\/lessons\//);
    expect(dashboard.recommendations).toHaveLength(4);
    expect(dashboard.queue).toHaveLength(3);
    expect(dashboard.queue.every(item => item.reason.length > 20)).toBe(true);
    for (const reader of Object.values(mocks)) expect(reader).toHaveBeenCalledTimes(1);
  });
});
