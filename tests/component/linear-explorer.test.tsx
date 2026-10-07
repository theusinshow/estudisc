import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { NumericExplorer } from "@/features/lessons/blocks/numeric-explorer";

it("updates a configured linear model and keeps an invalid editing value readable without feedback grading", async () => {
  const user = userEvent.setup();
  render(<NumericExplorer mode="linear" title="Modelo de fixture" variableLabel="Entrada" outputLabel="Resultado" min={0} max={10} step={1} initial={2} slope={3} intercept={1} explanation="Observe o resultado."/>);
  expect(screen.getByRole("status")).toHaveTextContent("Resultado: 7");
  await user.clear(screen.getByLabelText("Entrada", { exact: true })); await user.type(screen.getByLabelText("Entrada", { exact: true }), "3");
  expect(screen.getByRole("status")).toHaveTextContent("Resultado: 10");
  await user.clear(screen.getByLabelText("Entrada", { exact: true })); await user.type(screen.getByLabelText("Entrada", { exact: true }), "99");
  expect(screen.getByRole("status")).toHaveTextContent("Informe um valor entre");
  expect(screen.queryByText("Resposta correta")).toBeNull();
});
