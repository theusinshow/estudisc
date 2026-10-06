import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => vi.clearAllMocks());
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
  it("keeps a full catalog from turning Today into a lesson directory while retaining the active priority", async () => {
    mocks.inputs.mockResolvedValue({ dueReviews: [], mistakes: [], tracks: [], projects: [] });
    mocks.progress.mockResolvedValue({ ladder: [], cooling: [], week: [] });
    mocks.sessions.mockResolvedValue([{ id: "active", status: "ACTIVE" }]);
    mocks.lessons.mockResolvedValue(Array.from({ length: 132 }, (_, index) => ({
      id: `lesson-${String(index).padStart(3, "0")}`, title: `Lesson ${index}`, subjectCode: "POR", estimatedMinutes: 30,
      importance: 2, activityCount: 8, attempted: 0, passed: 0, prerequisiteIds: []
    })));
    const dashboard = await getTodayDashboard();
    expect(dashboard.nextAction?.href).toBe("/study/active");
    expect(dashboard.recommendations).toHaveLength(4);
    expect(dashboard.queue).toHaveLength(3);
    expect(dashboard.queue.every(item => item.reason.length > 20)).toBe(true);
    for (const reader of Object.values(mocks)) expect(reader).toHaveBeenCalledTimes(1);
  });
});
