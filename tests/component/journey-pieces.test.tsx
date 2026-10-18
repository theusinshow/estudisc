import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewDeck } from "@/features/review/review-deck";
import { GoalTower, goalTowerText } from "@/features/today/goal-tower";
import { FocusMode, focusLabel } from "@/features/study-tools/focus-mode";

afterEach(() => { vi.useRealTimers(); });
const card = (id: string, blindSpot = false) => ({ conceptId: id, title: `Conceito ${id}`, reason: "Motivo", due: "Para revisar desde 17/10", blindSpot });

describe("review deck", () => {
  it("starts a practice from the card without its own time choice, naming the concept for screen readers", () => {
    render(<ReviewDeck cards={[card("a")]} />);
    expect(screen.getByRole("button", { name: "Praticar Conceito a" })).toHaveTextContent("Praticar este conceito");
    expect(screen.queryByLabelText("Tempo para esta prática")).toBeNull();
    expect(screen.getByText("Para revisar desde 17/10")).toBeVisible();
  });
  it("moves between cards without recording anything and flags blind spots", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ReviewDeck cards={[card("a", true), card("b")]} />);
    expect(screen.getByText("Ponto cego")).toBeVisible();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole("heading", { name: "Conceito b" })).toBeVisible();
    expect(screen.getByText("Cartão 2 de 2")).toBeVisible();
    expect(screen.queryByText("Ponto cego")).toBeNull();
  });
});

describe("goal tower", () => {
  it("stacks one block per answer up to the goal", () => {
    const { container } = render(<GoalTower answered={3} />);
    expect(container.querySelectorAll(".goal-block")).toHaveLength(3);
    expect(goalTowerText(0)).toMatch(/Meta sugerida: 10/);
    expect(goalTowerText(9)).toBe("9 de 10. Falta 1 questão para a meta.");
    expect(goalTowerText(12)).toBe("Meta feita! 12 questões hoje.");
  });
});

describe("focus mode", () => {
  it("hides the tab bar while on and counts down", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<FocusMode />);
    fireEvent.click(screen.getByRole("button", { name: "Modo foco" }));
    expect(document.documentElement.dataset.focusMode).toBe("on");
    await act(async () => { vi.advanceTimersByTime(61000); });
    expect(screen.getByRole("timer")).toHaveAccessibleName(/Foco: faltam 23:5\d/);
    fireEvent.click(screen.getByRole("button", { name: "Sair do modo foco" }));
    expect(document.documentElement.dataset.focusMode).toBeUndefined();
    expect(focusLabel(25 * 60000)).toBe("25:00");
  });
});
