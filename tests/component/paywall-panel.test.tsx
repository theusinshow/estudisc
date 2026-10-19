import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { PaywallPanel } from "@/features/payments/paywall-panel";

afterEach(() => {
  cleanup();
});

describe("PaywallPanel component", () => {
  it("renders the R$ 39,90 checkout with the refund right, the 4 free sample lessons and the scholarship invite form", async () => {
    const user = userEvent.setup();
    render(<PaywallPanel lockedLessonTitle="Equações do 1º grau" />);

    expect(screen.getByRole("heading", { level: 1, name: "Esta aula faz parte do acesso completo" })).toBeInTheDocument();
    expect(screen.getByText(/Equações do 1º grau/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pagar R\$\s39,90 com Pix ou cartão$/ })).toBeInTheDocument();
    expect(screen.getByText(/Desistiu em até 7 dias/)).toHaveTextContent("Código de Defesa do Consumidor");
    expect(screen.getByText(/Menores de 18 anos/)).toHaveTextContent("responsável, que faz a compra");

    // All 4 interactive sample lessons are listed with links
    expect(screen.getByRole("link", { name: /Matemática\s*Porcentagem/i })).toHaveAttribute("href", "/lessons/MAT-07");
    expect(screen.getByRole("link", { name: /Ciências\s*Movimento/i })).toHaveAttribute("href", "/lessons/CIE-01");
    expect(screen.getByRole("link", { name: /Português\s*Inferência, implícitos, pressupostos e leitura de contexto/i })).toHaveAttribute("href", "/lessons/POR-03");
    expect(screen.getByRole("link", { name: /Geografia e História\s*Fusos horários e coordenadas geográficas/i })).toHaveAttribute("href", "/lessons/GH-51");

    // Scholarship / cohort invite form opens from its disclosure and stays accessible
    await user.click(screen.getByText("Tenho um código de bolsa ou convite"));
    expect(screen.getByLabelText("Código de convite")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ativar código de bolsa" })).toBeDisabled();
  });

  it("titles the general paywall with the price", () => {
    render(<PaywallPanel />);
    expect(screen.getByRole("heading", { level: 1, name: /^Tudo do Estudisc por R\$\s39,90, até a prova$/ })).toBeInTheDocument();
  });
});
