import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { questionSchema } from "@/features/questions/contracts";
import { studentQuestion } from "@/features/questions/student-view";
import { QuestionPanel } from "@/features/activities/components/question-panel";

const multipleChoice = () => studentQuestion(questionSchema.parse(source.questions.find(question => question.type === "multiple_choice")));

afterEach(() => vi.unstubAllGlobals());

it("keeps each choice named by its text and marks choices with A–E and 1–5 keys", () => {
  const question = multipleChoice();
  const { container } = render(<QuestionPanel question={question} activityStableId="activity" />);
  const radios = screen.getAllByRole("radio");
  expect(radios).toHaveLength(question.choices!.length);
  expect(radios[0]).toHaveAccessibleName(question.choices![0].content.replace(/\s+/g, " ").trim());
  expect(container.querySelectorAll(".answer-bubble-letter")[1]).toHaveTextContent("B");

  fireEvent.keyDown(radios[0], { key: "c" });
  expect(radios[2]).toBeChecked();
  expect(radios[2]).toHaveFocus();
  fireEvent.keyDown(radios[2], { key: "1" });
  expect(radios[0]).toBeChecked();
  fireEvent.keyDown(radios[0], { key: "z" });
  expect(radios[0]).toBeChecked();
});

it("announces the correction stamp through a live region that exists before the answer", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ correct: true, attemptId: "attempt-1", explanation: "Porque sim." }), { status: 200 })));
  const question = multipleChoice();
  const { container } = render(<QuestionPanel question={question} activityStableId="activity" />);
  const live = container.querySelector(".answer-result");
  expect(live).toHaveAttribute("aria-live", "polite");
  expect(live).toBeEmptyDOMElement();

  fireEvent.click(screen.getAllByRole("radio")[0]);
  fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));
  const status = await screen.findByRole("status", { name: "Resultado da resposta" });
  expect(status).toHaveTextContent("Resposta correta");
  expect(within(status).getByText("Certo")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("button", { name: "Resposta registrada" })).toBeDisabled());
});

it("opens a requested hint as a disclosure that can be collapsed", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ hintLevel: 1, hint: "Comece pelo enunciado." }), { status: 200 })));
  render(<QuestionPanel question={multipleChoice()} activityStableId="activity" hintCount={2} />);
  fireEvent.click(screen.getByRole("button", { name: "Ver uma dica" }));
  const toggle = await screen.findByRole("button", { name: "Dica 1 de 2" });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Comece pelo enunciado.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Ver mais uma dica" })).toBeEnabled();
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByText("Comece pelo enunciado.")).not.toBeVisible();
});
