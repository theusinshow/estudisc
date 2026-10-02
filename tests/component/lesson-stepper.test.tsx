import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { LessonStepper } from "@/features/lessons/lesson-stepper";

const steps = [
  { id: "a", kind: "intro" as const, label: "Para começar", node: <p>Primeiro</p> },
  { id: "b", kind: "practice" as const, label: "Prática", node: <p>Segundo</p> }
];
const completion = { trackHref: "/tracks/t", nextLesson: { href: "/lessons/next", title: "Porcentagem" } };

describe("LessonStepper", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("reopens the step stored in the URL hash", () => {
    window.history.replaceState(null, "", "/lessons/x#passo-2");
    render(<LessonStepper steps={steps} completion={completion} />);
    expect(screen.getByText("Passo 2 de 2", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Segundo")).toBeVisible();
  });

  it("ends in a completion screen that links to the next lesson", async () => {
    const user = userEvent.setup();
    render(<LessonStepper steps={steps} completion={completion} />);
    await user.click(screen.getByRole("button", { name: "Próximo" }));
    expect(window.location.hash).toBe("#passo-2");
    await user.click(screen.getByRole("button", { name: "Concluir aula" }));
    expect(window.location.hash).toBe("#concluida");
    expect(screen.getByRole("heading", { name: "Você chegou ao fim da aula" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Próxima aula: Porcentagem/ })).toHaveAttribute("href", "/lessons/next");
    await user.click(screen.getByRole("button", { name: "Rever último passo" }));
    expect(screen.getByText("Segundo")).toBeVisible();
  });

  it("leaves the URL alone inside a study session, where the session itself continues", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/study/s#passo-2");
    render(<LessonStepper steps={steps} />);
    expect(screen.getByText("Primeiro")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Próximo" }));
    expect(window.location.hash).toBe("#passo-2");
    expect(screen.getByRole("button", { name: "Fim desta aula" })).toBeDisabled();
  });
});
