import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { parseEducationalActivityConfig } from "@/features/activities/application/educational-activity";
import { EducationalActivityPanel } from "@/features/activities/components/educational-activity-panel";
import { isWordOrdering } from "@/features/activities/components/ordering-field";

const words = [{ id: "c", label: "cedo" }, { id: "a", label: "Ana" }, { id: "b", label: "chegou" }];

it("tells word orderings from solution steps", () => {
  expect(isWordOrdering(words)).toBe(true);
  expect(isWordOrdering([...words.slice(0, 2)])).toBe(false);
  expect(isWordOrdering([{ id: "x", label: "Divida $12$ por $3$" }, ...words])).toBe(false);
});

it("builds a sentence by tapping words, marks each position and restarts", async () => {
  const user = userEvent.setup();
  render(<EducationalActivityPanel prompt="Monte a frase" config={parseEducationalActivityConfig({ type: "ordering", items: words, expectedOrder: ["a", "b", "c"] })} />);
  await user.click(screen.getByRole("button", { name: "Colocar Ana na frase" }));
  await user.click(screen.getByRole("button", { name: "Colocar cedo na frase" }));
  expect(screen.getByLabelText("Sua ordem")).toHaveTextContent("Anacedo");
  await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
  expect(screen.getByRole("status")).toHaveTextContent("Parte do raciocínio");
  await user.click(screen.getByRole("button", { name: "Recomeçar" }));
  expect(screen.getByLabelText("Sua ordem")).toHaveTextContent("Toque nas palavras");
  for (const label of ["Ana", "chegou", "cedo"]) await user.click(screen.getByRole("button", { name: `Colocar ${label} na frase` }));
  await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
  expect(screen.getByRole("status")).toHaveTextContent("Resposta correta");
});

it("marks highlighted evidence as pressed and colours extra picks after checking", async () => {
  const user = userEvent.setup();
  const { container } = render(<EducationalActivityPanel prompt="Marque a evidência" config={parseEducationalActivityConfig({ type: "text-highlight", items: [{ id: "s1", label: "O preço subiu 10%." }, { id: "s2", label: "Choveu ontem." }], expectedIds: ["s1"] })} />);
  const extra = screen.getByRole("button", { name: "Choveu ontem." });
  await user.click(extra);
  expect(extra).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
  expect(container.querySelector('[data-correct="false"]')).toBe(extra);
  await user.click(extra);
  await user.click(screen.getByRole("button", { name: "O preço subiu 10%." }));
  await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
  expect(screen.getByRole("status")).toHaveTextContent("Resposta correta");
});
