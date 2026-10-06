import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StudyActionCard } from "@/features/today/study-action-card";

it("shows the authoritative reason without inventing counts or durations", () => {
  render(<StudyActionCard variant="review" title="Revisar porcentagem" reason="A revisão está prevista para hoje." href="/review" />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/review");
  expect(link).toHaveTextContent("A revisão está prevista para hoje.");
  expect(link).not.toHaveTextContent("min");
  expect(link).not.toHaveTextContent("atividades");
});

it("renders supplied estimates as estimates and activity counts with their correct unit", () => {
  render(<StudyActionCard variant="lesson" title="Regra de três" reason="Pré-requisitos disponíveis." href="/lessons/ratio" estimatedMinutes={18} activityCount={3} />);
  expect(screen.getByRole("link")).toHaveTextContent("~18 min");
  expect(screen.getByRole("link")).toHaveTextContent("3 atividades");
  expect(screen.getByRole("link")).toHaveTextContent("Estudar aula");
});
