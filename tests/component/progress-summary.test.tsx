import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressSummary } from "@/features/progress/progress-summary";

describe("ProgressSummary", () => {
  it("shows navigation progress without presenting concept mastery as complete", () => {
    render(
      <ProgressSummary
        progress={{
          trackStableId: "track",
          totalLessons: 1,
          completedLessons: 1,
          totalActivities: 1,
          attemptedActivities: 1,
          passedActivities: 1,
          masteryStatus: "not_calculated"
        }}
      />
    );

    expect(screen.getByLabelText("Progresso")).toHaveTextContent("Lições concluídas");
    expect(screen.getByLabelText("Progresso")).toHaveTextContent("Atividades aprovadas");
    expect(screen.getByLabelText("Progresso")).toHaveTextContent("Domínio dos conceitos");
    expect(screen.getByLabelText("Progresso")).toHaveTextContent("Ainda não calculado");
  });
});
