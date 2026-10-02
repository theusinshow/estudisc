import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressSummary } from "@/features/progress/progress-summary";
import { summarizeConceptMastery } from "@/features/progress/mastery-summary";

describe("ProgressSummary", () => {
  it("shows track navigation progress without presenting lesson completion as mastery", () => {
    render(
      <ProgressSummary
        progress={{
          trackStableId: "track",
          totalLessons: 1,
          completedLessons: 1,
          completedLessonStableIds: ["lesson"],
          totalActivities: 1,
          attemptedActivities: 1,
          passedActivities: 1,
          masteryStatus: "not_calculated"
        }}
      />
    );

    const summary = screen.getByLabelText("Progresso");
    expect(summary).toHaveTextContent("Seu progresso nesta trilha");
    expect(summary).toHaveTextContent("Aulas concluídas");
    expect(summary).toHaveTextContent("Atividades aprovadas");
    expect(summary).not.toHaveTextContent("Domínio dos conceitos");
  });

  it("shows the weakest practiced concept of a lesson from the mastery policy", () => {
    render(
      <ProgressSummary
        progress={{
          lessonStableId: "lesson",
          totalActivities: 3,
          attemptedActivities: 3,
          passedActivities: 3,
          masteryStatus: "not_calculated",
          mastery: summarizeConceptMastery([{ state: "practicing" }, { state: "understood" }, { state: "unseen" }])
        }}
      />
    );

    const summary = screen.getByLabelText("Progresso");
    expect(summary).toHaveTextContent("Seu progresso nesta aula");
    expect(summary).toHaveTextContent("Entendido");
    expect(summary).toHaveTextContent("2/3 conceitos praticados");
  });

  it("says there is no evidence yet before any practice", () => {
    expect(summarizeConceptMastery([{ state: "unseen" }])).toMatchObject({ conceptsWithEvidence: 0, weakestState: "unseen" });
  });
});
