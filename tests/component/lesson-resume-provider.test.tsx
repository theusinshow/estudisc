import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LessonResumeProvider, useLessonResume } from "@/features/lessons/resume-provider";
import { emptyResume } from "@/features/lessons/resume-contracts";

const scope = { trackId: "track", lessonId: "lesson", version: 1 };
function Step() { const resume = useLessonResume()!; return <button onClick={() => resume.update({ stepId: "second" })}>Go to second step</button>; }
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function transport() {
  const fetch = vi.fn(async (_url: string, options: RequestInit) => {
    const input = JSON.parse(options.body as string);
    return new Response(JSON.stringify({ revision: input.revision + 1, data: input.data, updatedAt: new Date().toISOString() }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetch); return fetch;
}
it("does not turn idle time or a clean page exit into repeated saves or revision conflicts", async () => {
  vi.useFakeTimers(); const fetch = transport();
  render(<LessonResumeProvider scope={scope} initial={{ revision: 1, data: emptyResume(), updatedAt: "2026-10-06T12:00:00Z" }}><Step /></LessonResumeProvider>);
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); window.dispatchEvent(new Event("pagehide")); });
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Go to second step" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toHaveTextContent("Ponto da aula salvo");
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); window.dispatchEvent(new Event("pagehide")); });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("flushes dirty state on client navigation before the debounce and keeps the payload bounded", async () => {
  vi.useFakeTimers(); const fetch = transport();
  const view = render(<LessonResumeProvider scope={scope} initial={null}><Step /></LessonResumeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Go to second step" }));
  await act(async () => { view.unmount(); await vi.advanceTimersByTimeAsync(1); });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][1].keepalive).toBe(true);
  expect(JSON.parse(fetch.mock.calls[0][1].body as string).data.stepId).toBe("second");
});
