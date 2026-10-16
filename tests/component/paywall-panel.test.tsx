import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PaywallPanel } from "@/features/payments/paywall-panel";

afterEach(() => {
  cleanup();
});

describe("PaywallPanel component", () => {
  it("renders R$ 50 lifetime checkout button, 4 interactive free sample lessons, and scholarship invite form", () => {
    render(<PaywallPanel lockedLessonTitle="Equações do 1º grau" />);

    expect(
      screen.getByRole("heading", { name: /Desbloqueie "Equações do 1º grau" e todo o curso IFSC/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Liberar acesso até a prova por R\$ 50 \(Pix ou cartão\)/i })
    ).toBeInTheDocument();

    // All 4 flagship interactive sample lessons are listed with links
    expect(screen.getByRole("link", { name: /Matemática · Porcentagem/i })).toHaveAttribute(
      "href",
      "/lessons/MAT-07"
    );
    expect(screen.getByRole("link", { name: /Ciências · Circuitos elétricos/i })).toHaveAttribute(
      "href",
      "/lessons/CIE-06"
    );
    expect(
      screen.getByRole("link", { name: /Português · Gêneros do discurso, tipos textuais e modalidades/i })
    ).toHaveAttribute("href", "/lessons/POR-01");
    expect(
      screen.getByRole("link", { name: /Geografia e História · Africanos, afrodescendentes e comunidades quilombolas em Santa Catarina/i })
    ).toHaveAttribute("href", "/lessons/GH-06");

    // Scholarship / cohort invite input is accessible
    expect(screen.getByLabelText("Código de convite")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ativar código de bolsa" })).toBeDisabled();
  });
});
