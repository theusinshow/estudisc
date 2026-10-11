import { expect, it, vi } from "vitest";
import { openStudySession } from "@/features/study-sessions/session-navigation";

it("opens a fresh document, including repeated transitions on the same session URL", () => {
  const location = { assign: vi.fn() };
  const id = "11111111-1111-4111-8111-111111111111";
  openStudySession(id, location);
  openStudySession(id, location);
  expect(location.assign.mock.calls).toEqual([[`/study/${id}`], [`/study/${id}`]]);
});
