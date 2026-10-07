import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { questionSchema } from "@/features/questions/contracts";
import { studentQuestion } from "@/features/questions/student-view";
import { QuestionPanel } from "@/features/activities/components/question-panel";
import { LessonResumeProvider } from "@/features/lessons/resume-provider";
import { emptyResume } from "@/features/lessons/resume-contracts";

it("restores a draft and actual revealed assistance together without inventing submitted feedback", () => {
  const question = studentQuestion(questionSchema.parse(source.questions[0]));
  const draft = { activityId: "activity", questionId: question.id, questionVersion: question.version, response: "12", submissionKey: crypto.randomUUID(), baseAttemptId: null };
  render(<LessonResumeProvider scope={{ trackId: "track", lessonId: "lesson", version: 1 }} initial={{ revision: 1, updatedAt: "2026-10-06T12:00:00Z", data: { ...emptyResume(), drafts: [draft] } }}>
    <QuestionPanel question={question} activityStableId="activity" hintCount={3} assistance={{ hintLevel: 1, hint: "Ajuda registrada", solutionRevealed: true, explanation: "Explicação já consultada" }} />
  </LessonResumeProvider>);
  expect(screen.getByRole("textbox", { name: /^Valor/ })).toHaveValue("12");
  expect(screen.getByText("Ajuda registrada")).toBeVisible();
  expect(screen.getByRole("status", { name: "Resultado da resposta" })).toHaveTextContent("Solução consultada");
  expect(screen.getByRole("button", { name: "Enviar resposta" })).toBeEnabled();
  expect(screen.queryByText("Tentativa registrada. Domínio depende de prática e revisão.")).toBeNull();
});
it("recovers wrong-shaped externally recorded responses before rendering ordering controls", () => {
  const question = studentQuestion(questionSchema.parse({ ...source.questions[0], type: "ordering", items: [{ id: "a", label: "A" }, { id: "b", label: "B" }], answer: { kind: "ordering", orderedIds: ["a", "b"] } }));
  render(<QuestionPanel question={question} activityStableId="ordering" lastAnswer="wrong-shaped-external-response" />);
  expect(screen.getByText("A")).toBeVisible(); expect(screen.getByText("B")).toBeVisible();
  expect(screen.getByRole("button", { name: "Enviar resposta" })).toBeEnabled();
});
