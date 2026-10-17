import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NumericExplorer } from "@/features/lessons/blocks/numeric-explorer";
import { numericExplorerSchema } from "@/features/lessons/blocks/numeric-explorer-schema";
import { interactionStateSchema } from "@/features/lessons/interaction-state";

const explanation = "Explicação do modelo.";
const parse = (config: unknown) => numericExplorerSchema.parse(config);

describe("ADR 0070 explorer schemas", () => {
  it("keeps the published percentage and linear payloads valid", () => {
    expect(numericExplorerSchema.safeParse({ initialValue: 200, initialPercentage: 15 }).success).toBe(true);
    expect(numericExplorerSchema.safeParse({ mode: "linear", title: "T", variableLabel: "x", outputLabel: "y", min: 0, max: 10, step: 1, initial: 2, slope: 2, intercept: 1, explanation }).success).toBe(true);
  });
  it("rejects models without a whole answer or with positions off the line", () => {
    expect(numericExplorerSchema.safeParse({ mode: "balance", title: "B", coefficient: 2, constant: 3, result: 8, explanation }).success).toBe(false);
    expect(numericExplorerSchema.safeParse({ mode: "number-line", title: "R", min: 0, max: 1, divisions: 4, initial: 5, explanation }).success).toBe(false);
    expect(numericExplorerSchema.safeParse({ mode: "number-line", title: "R", min: 0, max: 1, divisions: 4, initial: 0, target: 3, explanation }).success).toBe(false);
    expect(numericExplorerSchema.safeParse({ mode: "time-zones", title: "F", initialUtc: 12, places: [{ label: "A", offset: 0 }], explanation }).success).toBe(false);
  });
  it("stores explorer progress as a resumable interaction state", () => {
    expect(interactionStateSchema.safeParse({ target: "block", id: "b1", kind: "explorer", state: { position: 35, step: 0, checked: true } }).success).toBe(true);
  });
});

describe("ADR 0070 explorers", () => {
  it("paints the percent grid and checks the challenge", async () => {
    const user = userEvent.setup();
    render(<NumericExplorer {...parse({ mode: "percent-grid", title: "Grade", initial: 10, target: 35, explanation })} />);
    fireEvent.change(screen.getByLabelText("Quadradinhos pintados"), { target: { value: "35" } });
    expect(screen.getByRole("img")).toHaveAccessibleName("35 de 100 quadradinhos pintados");
    expect(screen.getByText(/= 35\/100 = 0,35/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Conferir" }));
    expect(screen.getByText("Isso: 35 de cada 100.")).toBeVisible();
  });

  it("places 3/4 on the number line", async () => {
    const user = userEvent.setup();
    render(<NumericExplorer {...parse({ mode: "number-line", title: "Reta", min: 0, max: 1, divisions: 8, initial: 1, target: 6, targetLabel: "3/4", ticks: [{ at: 0, label: "0" }, { at: 8, label: "1" }], explanation })} />);
    fireEvent.change(screen.getByLabelText("Posição na reta"), { target: { value: "6" } });
    expect(screen.getByText("0,75")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Conferir" }));
    expect(screen.getByText("Exato: 3/4 = 0,75.")).toBeVisible();
  });

  it("balances 2x + 3 = 11 by removing weights, dividing and guessing x", async () => {
    const user = userEvent.setup();
    render(<NumericExplorer {...parse({ mode: "balance", title: "Balança", coefficient: 2, constant: 3, result: 11, explanation })} />);
    expect(screen.getByText("2x + 3 = 11")).toBeVisible();
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Tirar 1 peso de cada lado" }));
    expect(screen.getByText("2x = 8")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Dividir os dois lados por 2" }));
    expect(screen.getByText("x = 4")).toBeVisible();
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Aumentar x" }));
    expect(screen.getByRole("status")).toHaveTextContent("Equilibrou: com x = 4");
  });

  it("moves the clocks with the UTC hour and flags the day change", () => {
    render(<NumericExplorer {...parse({ mode: "time-zones", title: "Fusos", initialUtc: 12, places: [{ label: "Brasília", offset: -3 }, { label: "Tóquio", offset: 9 }], explanation })} />);
    fireEvent.change(screen.getByLabelText("Hora em Greenwich (UTC)"), { target: { value: "20" } });
    expect(screen.getByText("17:00")).toBeVisible();
    expect(screen.getByText("05:00")).toBeVisible();
    expect(screen.getByText(/dia seguinte/)).toBeVisible();
  });
});
