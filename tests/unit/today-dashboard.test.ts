import { describe, expect, it, vi } from "vitest";
import { getTodayDashboard } from "@/features/today/get-today-dashboard";
import { buildRecommendations } from "@/features/recommendations/recommendation-rules";

const mocks = vi.hoisted(() => ({ inputs: vi.fn(), progress: vi.fn(), sessions: vi.fn(), lessons: vi.fn() }));
vi.mock("@/features/auth/owner", () => ({ getOwnerProfile: async () => ({ ownerId: "owner", role: "STUDENT" }) }));
vi.mock("@/db/connection", () => ({ getDatabaseUrl: () => "memory://local" }));
vi.mock("@/features/recommendations/api", () => ({ getRecommendationInputs: mocks.inputs }));
vi.mock("@/features/progress/api", () => ({ getProgressOverview: mocks.progress }));
vi.mock("@/features/study-sessions/api", () => ({ studySessionRepository: () => ({ list: mocks.sessions }) }));
vi.mock("@/features/recommendations/lesson-candidates", () => ({ listRecommendationLessons: mocks.lessons }));

describe("Today dashboard coordinator", () => {
  it("loads shared recommendation facts once and does not create sessions or mutate progress", async () => {
    mocks.inputs.mockResolvedValue({ dueReviews: [], mistakes: [], tracks: [], projects: [] });
    mocks.progress.mockResolvedValue({ ladder: [], cooling: [], week: [] });
    mocks.sessions.mockResolvedValue([{ id: "active", status: "ACTIVE" }]);
    mocks.lessons.mockResolvedValue([]);
    const dashboard = await getTodayDashboard();
    expect(dashboard.nextAction?.href).toBe("/study/active");
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
});
