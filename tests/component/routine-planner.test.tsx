import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RoutinePlanner } from "@/features/study-sessions/routine-planner";
import { buildRoutineWeek } from "@/features/study-sessions/routine-policy";
import type { RoutineSettings, RoutineState } from "@/features/study-sessions/routine-contracts";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
const initial: RoutineState = { routine: null, week: null, subjects: [{ code: "MAT", title: "Matemática" }, { code: "POR", title: "Português" }] };

it("keeps edits unsaved until preview and explicit apply; allows clearing/refilling a day's time", async () => {
  let postedSettings: RoutineSettings;
  const fetch = vi.fn(async (_url: string, options: RequestInit) => {
    const body = JSON.parse(String(options.body));
    if (body.action === "preview") {
      postedSettings = body.settings;
      const week = buildRoutineWeek(postedSettings, { subjectCodes: ["MAT", "POR"], sessions: [] }, new Date());
      return Response.json({ id: "11111111-1111-4111-8111-111111111111", settings: postedSettings, baseRevision: 0, week, expiresAt: new Date(Date.now() + 60_000).toISOString() });
    }
    return Response.json({ ...initial, routine: { revision: 1, settings: postedSettings!, updatedAt: new Date().toISOString() }, week: buildRoutineWeek(postedSettings!, { subjectCodes: ["MAT", "POR"], sessions: [] }, new Date()) });
  });
  vi.stubGlobal("fetch", fetch);
  render(<RoutinePlanner initial={initial} />);
  expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: "Segunda" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  const minutes = screen.getByLabelText("Segunda · minutos");
  fireEvent.change(minutes, { target: { value: "" } });
  expect(minutes).toBeInTheDocument();
  fireEvent.change(minutes, { target: { value: "60" } });
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Gerar prévia" }));
  await screen.findByRole("button", { name: "Salvar rotina" });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("heading", { name: "Minha semana" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Salvar rotina" }));
  await screen.findByRole("heading", { name: "Minha semana" });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(router.refresh).toHaveBeenCalledTimes(1);
});

it("shows an honest no-content state without manufacturing a routine", () => {
  render(<RoutinePlanner initial={{ routine: null, week: null, subjects: [] }} />);
  expect(screen.getByText(/quando houver matérias com conteúdo publicado/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Gerar prévia" })).not.toBeInTheDocument();
});

it("shows a retired subject for explicit removal rather than trapping it in an invisible saved selection", () => {
  const settings: RoutineSettings = { timezone: "UTC", mode: "ASSISTED", days: Array.from({ length: 7 }, (_, weekday) => ({ weekday, minutes: 30 })), subjects: [{ code: "MAT", priority: "normal" }, { code: "OLD", priority: "normal" }], manualAllocations: [], overrides: [], reviewPercent: 20 };
  render(<RoutinePlanner initial={{ subjects: [{ code: "MAT", title: "Matemática" }], routine: { revision: 1, settings, updatedAt: new Date().toISOString() }, week: buildRoutineWeek(settings, { subjectCodes: ["MAT"], sessions: [] }, new Date()) }} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar rotina" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  const retired = screen.getByRole("checkbox", { name: "OLD (indisponível)" });
  expect(retired).toBeChecked();
  fireEvent.click(retired);
  expect(screen.queryByRole("checkbox", { name: "OLD (indisponível)" })).not.toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: "Matemática" })).toBeChecked();
});
