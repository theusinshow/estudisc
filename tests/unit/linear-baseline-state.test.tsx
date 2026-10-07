import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LinearExplorer } from "@/features/lessons/blocks/linear-explorer";
import { linearExplorerSchema } from "@/features/lessons/blocks/numeric-explorer-schema";
import recipe from "../../tools/estudisc-content-studio/recipes/ticket-price-linear.v1.json";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/features/lessons/resume-provider", () => ({ useLessonResume: () => ({
  data: { interactions: [{ target: "block", id: "saved-linear", kind: "linear-explorer", state: { input: "20" } }] },
  setInteraction: () => { throw new Error("Static rendering must never persist an interaction"); }
}) }));
const parameters = linearExplorerSchema.parse(recipe.additions[0].parameters);
it("ignores supplied saved interaction when baseline input is local only", () => {
  const markup = renderToStaticMarkup(<LinearExplorer {...parameters} enhanced={false} interaction={{ target: "block", id: "saved-linear" }}/>);
  expect(markup).toContain("Preço: 135 reais"); expect(markup).toContain('value="9"');
  expect(markup).not.toContain('type="range"');
});
it("retains existing saved input and slider when the enhancement is enabled", () => {
  const markup = renderToStaticMarkup(<LinearExplorer {...parameters} enhanced interaction={{ target: "block", id: "saved-linear" }}/>);
  expect(markup).toContain("Preço: 300 reais"); expect(markup).toContain('value="20"');
  expect(markup).toContain('type="range"');
});
it("updates baseline input without invoking the supplied resume writer", () => {
  render(<LinearExplorer {...parameters} enhanced={false} interaction={{ target: "block", id: "saved-linear" }}/>);
  fireEvent.change(screen.getByRole("textbox", { name: "Quantidade de ingressos (ingressos)" }), { target: { value: "12" } });
  expect(screen.getByRole("status")).toHaveTextContent("Preço: 180 reais");
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
});
