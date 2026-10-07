import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { expect, it } from "vitest";
import { LinearExplorer } from "@/features/lessons/blocks/linear-explorer";
import { linearExplorerSchema } from "@/features/lessons/blocks/numeric-explorer-schema";
import recipe from "../../tools/estudisc-content-studio/recipes/algebraic-price.v1.json";

const parameters = recipe.additions[0].parameters;
it("requires integer bounds/initial/step only for the explicitly discrete configuration", () => {
  expect(linearExplorerSchema.safeParse(parameters).success).toBe(true);
  for (const field of ["min", "max", "initial", "step"]) expect(linearExplorerSchema.safeParse({ ...parameters, [field]: 1.5 }).success).toBe(false);
  const { integerInput: ignored, ...legacy } = parameters;
  expect(ignored).toBe(true);
  expect(linearExplorerSchema.parse(legacy)).not.toHaveProperty("integerInput");
});
it("shows recovery for fractional counts and restores the authored price after correction", () => {
  render(<LinearExplorer {...linearExplorerSchema.parse(parameters)} enhanced={false}/>);
  const quantity = screen.getByRole("textbox", { name: "Quantidade de cartazes" });
  expect(screen.getByRole("status")).toHaveTextContent("Preço total: 29 reais");
  fireEvent.change(quantity, { target: { value: "3,5" } });
  expect(screen.getByRole("status")).toHaveTextContent("Informe um número inteiro entre 1 e 20.");
  fireEvent.change(quantity, { target: { value: "4" } });
  expect(screen.getByRole("status")).toHaveTextContent("Preço total: 37 reais");
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
});
it("retains decimal inputs when the optional constraint is absent", () => {
  cleanup();
  const { integerInput: ignored, ...legacy } = parameters;
  expect(ignored).toBe(true);
  render(<LinearExplorer {...linearExplorerSchema.parse(legacy)} enhanced={false}/>);
  fireEvent.change(screen.getByRole("textbox", { name: "Quantidade de cartazes" }), { target: { value: "3,5" } });
  expect(screen.getByRole("status")).toHaveTextContent("Preço total: 33 reais");
});
