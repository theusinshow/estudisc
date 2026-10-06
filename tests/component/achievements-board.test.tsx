import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AchievementsBoard } from "@/features/gamification/achievements-board";
import { buildGamificationSummary } from "@/features/gamification/gamification-rules";

describe("AchievementsBoard", () => {
  it("offers an honest first mission, numeric progress and expandable badge criteria", () => {
    const summary = buildGamificationSummary({ xp: { totalXp: 0, transactions: [] }, dueReviews: [], mistakes: [], now: new Date("2026-10-02T12:00:00Z") });
    render(<AchievementsBoard summary={summary} />);
    expect(screen.getByRole("heading", { name: "Suas conquistas", level: 1 })).toBeVisible();
    expect(screen.getByRole("link", { name: "Buscar essa conquista" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("progressbar", { name: "Progresso para Saiu do zero" })).toHaveAttribute("value", "0");
    const album = screen.getByRole("list", { name: "Selos de estudo" });
    expect(within(album).getAllByText("A conquistar")).toHaveLength(6);
    const badge = album.querySelector("details")!;
    expect(badge).not.toHaveAttribute("open");
    expect(badge.querySelector("summary")).toHaveTextContent("Saiu do zero");
    expect(screen.getByRole("list", { name: "Seus dias de estudo nesta semana" }).children).toHaveLength(7);
    expect(screen.getByText(/Perdeu um dia/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver meu aprendizado" })).toHaveAttribute("href", "/progress");
  });

  it("handles a complete collection without an impossible next unlock", () => {
    const summary = buildGamificationSummary({ xp: { totalXp: 300, transactions: [] }, dueReviews: [], mistakes: [] });
    render(<AchievementsBoard summary={{ ...summary, badges: summary.badges.map(badge => ({ ...badge, earned: true })) }} />);
    expect(screen.getByText("Coleção completa")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Buscar essa conquista" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continuar meu estudo" })).toHaveAttribute("href", "/");
    expect(screen.getByText("6/6 conquistados")).toBeVisible();
  });
});
