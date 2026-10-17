import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SampleQuestion } from "@/features/public-site/sample-question";

const question = { lessonTitle: "Porcentagem", subject: "Matemática", stem: "Converta a fração 7/20 em porcentagem.", correctChoiceId: "c", explanation: "7/20 = 35/100.",
  choices: [{ id: "a", content: "70%" }, { id: "b", content: "20%" }, { id: "c", content: "35%" }, { id: "d", content: "140%" }, { id: "e", content: "7%" }] };

it("is solvable with keys and confirms explicitly, announcing a stamped result without recording anything", () => {
  const { container } = render(<SampleQuestion question={question} />);
  expect(screen.getByRole("button", { name: "Conferir resposta" })).toBeDisabled();
  fireEvent.keyDown(screen.getAllByRole("radio")[0], { key: "b" });
  expect(screen.getByRole("radio", { name: "20%" })).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Conferir resposta" }));
  expect(screen.getByRole("status", { name: "Resultado da amostra" })).toHaveTextContent("Ainda não");
  expect(container.querySelector(".answer-result")).toHaveAttribute("aria-live", "polite");
  fireEvent.keyDown(screen.getByRole("radio", { name: "20%" }), { key: "3" });
  expect(screen.queryByRole("status", { name: "Resultado da amostra" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Conferir resposta" }));
  expect(screen.getByRole("status", { name: "Resultado da amostra" })).toHaveTextContent(/Certo.*Resposta correta.*35\/100/);
});
