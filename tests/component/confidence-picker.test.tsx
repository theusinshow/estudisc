import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { QuestionPanel } from "@/features/activities/components/question-panel";
import { questionSchema } from "@/features/questions/contracts";
import { studentQuestion } from "@/features/questions/student-view";

afterEach(() => vi.unstubAllGlobals());
const reply = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

it("sends the chosen confidence once and explains a blind spot", async () => {
  const question = studentQuestion(questionSchema.parse({ ...source.questions[0], type: "multiple_choice", choices: [{ id: "a", content: "Um", correct: false }, { id: "b", content: "Dois", correct: true }], answer: { kind: "multiple_choice", choiceId: "b" } }));
  const fetchMock = vi.fn().mockReturnValueOnce(reply({ attemptId: "1", correct: false, solutionShown: false, xpAwarded: 0 })).mockReturnValueOnce(reply({ attemptId: "2", correct: true, explanation: "Ok.", xpAwarded: 10 }));
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(<QuestionPanel question={question} activityStableId="activity" />);
  await user.click(screen.getByRole("radio", { name: /Um/ }));
  await user.click(screen.getByRole("button", { name: "Tenho certeza" }));
  expect(screen.getByRole("button", { name: "Tenho certeza" })).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "Enviar resposta" }));
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ confidence: "sure" });
  expect(await screen.findByText(/Ponto cego encontrado/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Tenho certeza" })).toHaveAttribute("aria-pressed", "false");
  await user.click(screen.getByRole("radio", { name: /Dois/ }));
  await user.click(screen.getByRole("button", { name: "Enviar resposta" }));
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).confidence).toBeUndefined();
});
