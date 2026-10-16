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
      screen.getByRole("button", { name: /Liberar acesso vitalício por R\$ 50 \(Pix ou Cartão\)/i })
    ).toBeInTheDocument();

    // All 4 flagship interactive sample lessons are listed with links
    expect(screen.getByRole("link", { name: /Matemática · Porcentagem: parte, desconto e preço final/i })).toHaveAttribute(
      "href",
      "/lessons/MAT-07"
    );
    expect(screen.getByRole("link", { name: /Ciências · Estrutura atômica: partículas, massa e íons/i })).toHaveAttribute(
      "href",
      "/lessons/CIE-06"
    );
    expect(
      screen.getByRole("link", { name: /Português · Compreensão e inferência: o texto sustenta sua leitura\?/i })
    ).toHaveAttribute("href", "/lessons/POR-01");
    expect(
      screen.getByRole("link", { name: /Geografia e História · Escravidão, resistência e abolição como processo/i })
    ).toHaveAttribute("href", "/lessons/GH-06");

    // Scholarship / cohort invite input is accessible
    expect(screen.getByLabelText("Código de convite")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ativar código de bolsa" })).toBeDisabled();
  });
});
