import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SessionControls } from "@/features/study-sessions/session-controls";
import { TargetedPracticeControls } from "@/features/study-sessions/targeted-practice-controls";

const navigation = vi.hoisted(() => ({ open: vi.fn() }));
vi.mock("@/features/study-sessions/session-navigation", () => ({ openStudySession: navigation.open }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
const sessionId = "11111111-1111-4111-8111-111111111111";

it("keeps pending feedback after success while opening the returned existing session", async () => {
  const fetch = vi.fn(async () => Response.json({ sessionId, status: "ACTIVE" }));
  vi.stubGlobal("fetch", fetch);
  render(<SessionControls adaptive />);
  fireEvent.click(screen.getByRole("button", { name: "Estudar 10 min" }));
  await waitFor(() => expect(navigation.open).toHaveBeenCalledWith(sessionId));
  expect(screen.getByRole("status")).toHaveTextContent("Abrindo sessão");
  expect(screen.getByRole("button", { name: "Estudar 10 min" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "20 min" }));
  expect(fetch).toHaveBeenCalledTimes(1);
});

it.each(["start", "complete", "abandon"] as const)("opens a fresh document after %s on the same session", async action => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ sessionId, status: action === "start" ? "ACTIVE" : action === "complete" ? "COMPLETED" : "ABANDONED" }));
  vi.stubGlobal("fetch", fetch);
  render(<SessionControls sessionId={sessionId} status={action === "start" ? "PLANNED" : "ACTIVE"} />);
  fireEvent.click(screen.getByRole("button", { name: action === "start" ? "Começar sessão" : action === "complete" ? "Concluir sessão" : "Encerrar sem concluir" }));
  await waitFor(() => expect(navigation.open).toHaveBeenCalledWith(sessionId));
  expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ action, sessionId });
});

it("shows an API error and permits retry without navigating", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: "routine_budget_exceeded", message: "Confira sua rotina." }, { status: 409 })));
  render(<SessionControls />);
  fireEvent.click(screen.getByRole("button", { name: "Estudar 15 min" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Confira sua rotina.");
  expect(screen.getByRole("button", { name: "Estudar 15 min" })).toBeEnabled();
  expect(navigation.open).not.toHaveBeenCalled();
});

it("rejects an invalid returned session ID without navigating", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ sessionId: "bad-id", status: "ACTIVE" })));
  render(<SessionControls />);
  fireEvent.click(screen.getByRole("button", { name: "Estudar 15 min" }));
  await screen.findByRole("alert");
  expect(navigation.open).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Estudar 15 min" })).toBeEnabled();
});

it("opens targeted practice with the same pending document navigation", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ sessionId, status: "PLANNED" })));
  render(<TargetedPracticeControls kind="review" />);
  const button = screen.getByRole("button", { name: "Revisão rápida" });
  fireEvent.click(button);
  await waitFor(() => expect(navigation.open).toHaveBeenCalledWith(sessionId));
  expect(screen.getByRole("status")).toHaveTextContent("Abrindo sessão");
  expect(button).toBeDisabled();
});
