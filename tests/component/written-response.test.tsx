import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { LessonBlockList } from "@/features/lessons/blocks";

const recall = { stableId: "r", type: "note", payload: { type: "note", title: "Recuperação ativa", content: "Explique movimento sem olhar.\n\nUm corpo se move em relação a um referencial.\n\ncorreção explícita de pelo menos um erro conceitual da aula", editorial: { type: "EXIT_TICKET" } } };
const open = { stableId: "o", type: "note", payload: { type: "note", title: "Atividade de aplicação", content: "Compare notícia e receita.\n\nResposta curta ou classificação justificada.", editorial: { type: "ACTIVE_LEARNING" } } };

it("keeps the expected ideas closed until the student writes and checks, and never shows the rubric", async () => {
  const user = userEvent.setup();
  render(<LessonBlockList blocks={[recall]} />);
  expect(screen.queryByText(/Um corpo se move/)).toBeNull();
  const check = screen.getByRole("button", { name: "Conferir" });
  expect(check).toBeDisabled();
  await user.type(screen.getByRole("textbox", { name: /Sua resposta/ }), "Depende do referencial.");
  await user.click(check);
  expect(screen.getByText("Um corpo se move em relação a um referencial.")).toBeVisible();
  expect(screen.queryByText(/correção explícita/)).toBeNull();
});

it("gives open activities a text field without an answer key or the authoring format line", () => {
  render(<LessonBlockList blocks={[open]} />);
  expect(screen.getByRole("textbox", { name: "Sua resposta" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Conferir" })).toBeNull();
  expect(screen.queryByText(/Resposta curta ou classificação/)).toBeNull();
});
