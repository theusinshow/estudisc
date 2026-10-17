import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { questionSchema } from "@/features/questions/contracts";
import { studentQuestion } from "@/features/questions/student-view";
import { QuestionPanel } from "@/features/activities/components/question-panel";

const reply = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
afterEach(() => vi.unstubAllGlobals());

it("explains the chosen option, then opens the solution and the correct choice after the second failure", async () => {
  const question = studentQuestion(questionSchema.parse({ ...source.questions[0], type: "multiple_choice", choices: [{ id: "a", content: "Trajetória", correct: false }, { id: "b", content: "Deslocamento", correct: true }], answer: { kind: "multiple_choice", choiceId: "b" } }));
  const fetch = vi.fn()
    .mockReturnValueOnce(reply({ attemptId: "1", correct: false, choiceFeedback: "Trajetória é o caminho, não a variação de posição.", solutionShown: false, xpAwarded: 0 }))
    .mockReturnValueOnce(reply({ attemptId: "2", correct: false, solutionShown: true, explanation: "Deslocamento liga o início ao fim.", answerKey: { kind: "multiple_choice", choiceId: "b" }, xpAwarded: 0 }));
  vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup();
  render(<QuestionPanel question={question} activityStableId="activity" hintCount={1} />);
  await user.click(screen.getByRole("radio", { name: /Trajetória/ }));
  await user.click(screen.getByRole("button", { name: "Enviar resposta" }));
  const result = await screen.findByRole("status", { name: "Resultado da resposta" });
  expect(result).toHaveTextContent("Trajetória é o caminho, não a variação de posição.");
  expect(result).toHaveTextContent("Se travar, peça uma dica.");
  expect(result).not.toHaveTextContent("Deslocamento liga");
  await user.click(screen.getByRole("radio", { name: /Trajetória/ }));
  await user.click(screen.getByRole("button", { name: "Enviar resposta" }));
  expect(await screen.findByText("Deslocamento liga o início ao fim.")).toBeVisible();
  expect(screen.getByText(/resposta correta/)).toBeVisible();
  expect(screen.queryByRole("button", { name: /Ver solução/ })).toBeNull();
});

it("marks each pair of a matching question and labels a recovered success apart from a first try", async () => {
  const question = studentQuestion(questionSchema.parse({ ...source.questions[0], type: "matching", items: [{ id: "i1", label: "Carro" }, { id: "i2", label: "Bola" }], destinations: [{ id: "d1", label: "Rodas" }, { id: "d2", label: "Esfera" }], answer: { kind: "matching", pairs: { i1: "d1", i2: "d2" } } }));
  vi.stubGlobal("fetch", vi.fn()
    .mockReturnValueOnce(reply({ attemptId: "1", correct: false, itemResults: [{ itemId: "i1", correct: true }, { itemId: "i2", correct: false }], solutionShown: false, xpAwarded: 0 }))
    .mockReturnValueOnce(reply({ attemptId: "2", correct: true, explanation: "Ok.", xpAwarded: 10, reward: "assisted" })));
  const user = userEvent.setup();
  render(<QuestionPanel question={question} activityStableId="activity" />);
  await user.click(screen.getByRole("button", { name: "Pegar Carro" }));
  await user.click(screen.getByRole("button", { name: "Rodas" }));
  await user.click(screen.getByRole("button", { name: "Pegar Bola" }));
  await user.click(screen.getByRole("button", { name: "Rodas" }));
  await user.click(screen.getByRole("button", { name: "Enviar resposta" }));
  expect(await screen.findByRole("status", { name: "Resultado da resposta" })).toHaveTextContent("1 de 2 partes estão certas");
  expect(screen.getByRole("button", { name: "Carro, certo, toque para devolver" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Bola, revise, toque para devolver" }));
  await user.click(screen.getByRole("button", { name: "Pegar Bola" }));
  await user.click(screen.getByRole("button", { name: "Esfera" }));
  expect(screen.queryByRole("button", { name: /revise/ })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Enviar resposta" }));
  expect(await screen.findByRole("status", { name: "Recompensas de estudo" })).toHaveTextContent("+10 XP · Acertou depois de revisar.");
});

it("shows no shouted REVISE stamp on a wrong answer inside the lesson", async () => {
  const question = studentQuestion(questionSchema.parse({ ...source.questions[0], type: "multiple_choice", choices: [{ id: "a", content: "Um", correct: false }, { id: "b", content: "Dois", correct: true }], answer: { kind: "multiple_choice", choiceId: "b" } }));
  vi.stubGlobal("fetch", vi.fn().mockReturnValueOnce(reply({ attemptId: "1", correct: false, solutionShown: false, xpAwarded: 0 })));
  const user = userEvent.setup();
  const { container } = render(<QuestionPanel question={question} activityStableId="activity" />);
  await user.click(screen.getByRole("radio", { name: /Um/ }));
  await user.click(screen.getByRole("button", { name: "Enviar resposta" }));
  expect(await screen.findByRole("status", { name: "Resultado da resposta" })).toHaveTextContent("Ainda não");
  expect(container.querySelector(".answer-stamp")).toBeNull();
});
