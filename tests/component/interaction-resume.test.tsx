import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { LessonResumeProvider } from "@/features/lessons/resume-provider";
import { emptyResume } from "@/features/lessons/resume-contracts";
import { EducationalActivityPanel } from "@/features/activities/components/educational-activity-panel";
import { educationalActivitySchema } from "@/features/activities/application/educational-activity";
import { AtomModel } from "@/features/lessons/blocks/atom-model";
import { PredictionPanel } from "@/features/lessons/blocks/prediction-panel";

it("restores a wrong-but-valid matching response and recomputes local feedback/help", () => {
  const config = educationalActivitySchema.parse({ type: "matching", items: [{ id: "a", label: "A" }, { id: "b", label: "B" }], destinations: [{ id: "x", label: "X" }, { id: "y", label: "Y" }], expected: { a: "x", b: "y" }, assistance: { hint: "Pista", recall: "Recorde", analogousExample: "Exemplo", walkthrough: "Confira cada relação" } });
  render(<LessonResumeProvider scope={{ trackId: "track", lessonId: "lesson", version: 1 }} initial={{ revision: 1, updatedAt: "2026-10-06T12:00:00Z", data: { ...emptyResume(), interactions: [{ target: "block", id: "pair", kind: "educational", state: { response: { a: "y", b: "y" }, helpLevel: 4, checked: true } }] } }}>
    <EducationalActivityPanel prompt="Relacione" config={config} interaction={{ target: "block", id: "pair" }}/>
  </LessonResumeProvider>);
  expect(screen.getByLabelText("A")).toHaveValue("y");
  expect(screen.getByText("Passo a passo")).toBeVisible();
  expect(screen.getByText("Confira cada relação")).toBeVisible();
  expect(screen.getByText("Parte do raciocínio está no caminho")).toBeVisible();
  expect(screen.queryByText("Resposta correta")).toBeNull();
});
it("changes particle parameters without losing edits to the reveal reset", async () => {
  const user = userEvent.setup(); render(<AtomModel kind="atom" protons={6} neutrons={6} electrons={6}/>);
  await user.clear(screen.getByLabelText("Prótons")); await user.type(screen.getByLabelText("Prótons"), "11");
  expect(screen.getByText("11")).toBeVisible();
  await user.type(screen.getByLabelText("Qual será a carga?"), "5");
  await user.click(screen.getByRole("button", { name: "Conferir previsão" }));
  expect(screen.getByRole("status")).toHaveTextContent("Sua previsão está correta");
});
it("keeps prediction before observation/explanation without emitting a submitted result", async () => {
  const user = userEvent.setup(); render(<PredictionPanel title="Preveja" prompt="O que muda?" observation="Observe a figura" explanation="Compare os dados" interaction={{ target: "block", id: "predict" }}/>);
  expect(screen.getByRole("button", { name: "Observar" })).toBeDisabled();
  await user.type(screen.getByLabelText("Sua previsão"), "Aumenta");
  await user.click(screen.getByRole("button", { name: "Observar" }));
  await user.click(screen.getByRole("button", { name: "Conferir explicação" }));
  expect(screen.getByRole("status")).toHaveTextContent("Compare os dados");
  expect(screen.getByRole("status")).toHaveTextContent("Esta previsão é exploratória");
});
