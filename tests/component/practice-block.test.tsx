import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticeBlockButton } from "@/features/study-sessions/practice-block-button";
import { PracticeBlockStepper } from "@/features/study-sessions/practice-block-stepper";
import { ATTEMPT_RECORDED_EVENT } from "@/features/progress/live-progress-summary";

const navigation = vi.hoisted(() => ({ open: vi.fn() }));
vi.mock("@/features/study-sessions/session-navigation", () => ({ openStudySession: navigation.open }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
const sessionId = "11111111-1111-4111-8111-111111111111";
const steps = ["q1", "q2"].map(id => ({ stableId: `a-${id}`, questionId: id, node: <p>Questão {id}</p> }));
const answer = (questionId: string) => act(() => { window.dispatchEvent(new CustomEvent(ATTEMPT_RECORDED_EVENT, { detail: { questionId, stem: "", correct: true } })); });

describe("PracticeBlockStepper", () => {
  it("shows one Question at a time and moves on only after an answer", () => {
    render(<PracticeBlockStepper sessionId={sessionId} steps={steps} answeredQuestionIds={[]} />);
    expect(screen.getByText("1 de 2")).toBeVisible();
    expect(screen.getByText("Questão q1")).toBeVisible();
    expect(screen.getByText("Questão q2")).not.toBeVisible();
    expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();
    answer("q1");
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(screen.getByText("2 de 2")).toBeVisible();
    expect(screen.getByText("Questão q2")).toBeVisible();
    expect(screen.getByText("Questão q1")).not.toBeVisible();
  });
  it("resumes at the first unanswered Question, completes on the last answer and opens the summary", async () => {
    const fetch = vi.fn(async () => Response.json({ sessionId, status: "COMPLETED" }));
    vi.stubGlobal("fetch", fetch);
    render(<PracticeBlockStepper sessionId={sessionId} steps={steps} answeredQuestionIds={["q1"]} />);
    expect(screen.getByText("2 de 2")).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
    answer("q2");
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/study-sessions", expect.objectContaining({ body: JSON.stringify({ action: "complete", sessionId }) })));
    fireEvent.click(await screen.findByRole("button", { name: "Ver resumo" }));
    expect(navigation.open).toHaveBeenCalledWith(sessionId);
  });
  it("offers a retry when closing the block fails", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetch);
    render(<PracticeBlockStepper sessionId={sessionId} steps={steps} answeredQuestionIds={["q1", "q2"]} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível fechar o bloco");
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});

describe("PracticeBlockButton", () => {
  it("starts a block for its target with no time choice and opens it", async () => {
    const fetch = vi.fn(async () => Response.json({ sessionId, status: "ACTIVE" }));
    vi.stubGlobal("fetch", fetch);
    render(<PracticeBlockButton target={{ kind: "review", conceptId: "MAT.X" }} label="Praticar este conceito" ariaLabel="Praticar Porcentagem" />);
    expect(screen.queryByRole("combobox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Praticar Porcentagem" }));
    await waitFor(() => expect(navigation.open).toHaveBeenCalledWith(sessionId));
    expect(fetch).toHaveBeenCalledWith("/api/study-sessions", expect.objectContaining({ body: JSON.stringify({ action: "practice_block", target: { kind: "review", conceptId: "MAT.X" } }) }));
  });
  it("explains an empty target with a lesson link", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: "content_gap", message: "Sem questões novas para este conceito agora. Volte amanhã ou revise a aula." }, { status: 409 })));
    render(<PracticeBlockButton target={{ kind: "review", conceptId: "MAT.X" }} label="Praticar este conceito" lessonHref="/concepts/MAT.X" />);
    fireEvent.click(screen.getByRole("button", { name: "Praticar este conceito" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sem questões novas para este conceito agora.");
    expect(screen.getByRole("link", { name: "Revisar a aula" })).toHaveAttribute("href", "/concepts/MAT.X");
  });
  it("keeps the paywall link for accounts without full access", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: "paid_access_required", message: "A prática de revisão e de erros faz parte do acesso completo do Estudisc." }, { status: 403 })));
    render(<PracticeBlockButton target={{ kind: "review" }} label="Revisar agora" />);
    fireEvent.click(screen.getByRole("button", { name: "Revisar agora" }));
    expect(await screen.findByRole("link", { name: "Ver acesso completo" })).toHaveAttribute("href", "/upgrade");
  });
});
