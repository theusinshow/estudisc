import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { EducationalActivityPanel } from "@/features/activities/components/educational-activity-panel";
import { parseEducationalActivityConfig } from "@/features/activities/application/educational-activity";
import { NumericExplorer } from "@/features/lessons/blocks/numeric-explorer";

it("allows ordering with keyboard buttons and explains the result", async () => {
  const user = userEvent.setup();
  render(<EducationalActivityPanel prompt="Ordene" config={parseEducationalActivityConfig({ type: "ordering", items: [{id:"b",label:"Segundo"},{id:"a",label:"Primeiro"}], expectedOrder:["a","b"] })} />);
  const up = screen.getByRole("button", {name:"Mover Primeiro para cima"});
  up.focus(); await user.keyboard("{Enter}");
  await user.click(screen.getByRole("button", {name:"Conferir resposta"}));
  expect(screen.getByRole("status")).toHaveTextContent("Resposta correta");
});
it("explores percentages and rejects empty values", async () => {
  const user = userEvent.setup();
  render(<NumericExplorer initialValue={200} initialPercentage={15} />);
  expect(screen.getByRole("status")).toHaveTextContent("15% de 200 = 30");
  await user.clear(screen.getByLabelText("Valor base"));
  expect(screen.getByRole("status")).toHaveTextContent("Informe uma base");
});
