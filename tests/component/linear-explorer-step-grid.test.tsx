import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { LinearExplorer } from "@/features/lessons/blocks/linear-explorer";
import { linearExplorerSchema } from "@/features/lessons/blocks/numeric-explorer-schema";

// Shape of the held MAT-03 candidate (handoff 2026-10-11-fraction-explorer-input): denominators 10..60 in steps of 10.
const config = linearExplorerSchema.parse({ mode: "linear", title: "Frações equivalentes a 7/10", variableLabel: "Denominador", outputLabel: "Numerador correspondente", min: 10, max: 60, step: 10, initial: 30, slope: 0.7, intercept: 0, integerInput: true, explanation: "Os dois termos mudam pelo mesmo fator." });

it("keeps typed discrete values on the authored step grid with explicit recovery", () => {
  render(<LinearExplorer {...config} enhanced={false} />);
  const denominator = screen.getByRole("textbox", { name: "Denominador" });
  expect(screen.getByRole("status")).toHaveTextContent("Numerador correspondente: 21");
  fireEvent.change(denominator, { target: { value: "15" } });
  expect(screen.getByRole("status")).toHaveTextContent("Informe um número inteiro entre 10 e 60, de 10 em 10.");
  expect(screen.getByRole("status")).not.toHaveTextContent("10,5");
  fireEvent.change(denominator, { target: { value: "40" } });
  expect(screen.getByRole("status")).toHaveTextContent("Numerador correspondente: 28");
});
