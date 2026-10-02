import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/layout/app-shell";

describe("AppShell", () => {
  it("renders the accessible foundation shell without claiming product screens are complete", () => {
    render(
      <AppShell>
        <h1>Conteúdo principal</h1>
      </AppShell>
    );

    expect(screen.getByRole("link", { name: /pular para o conteúdo principal/i })).toHaveAttribute(
      "href",
      "#main-content"
    );
    expect(screen.getByRole("link", { name: "Vecta, página inicial" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hoje/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /aprender/i })).toHaveAttribute("href", "/tracks");
    expect(screen.getByRole("link", { name: /revisar/i, hidden:true })).toHaveAttribute("href", "/review");
    expect(screen.getByRole("link", { name: /progresso/i })).toHaveAttribute("href", "/progress");
    expect(screen.getByText("Mais")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /histórico/i, hidden: true })).toHaveAttribute("href", "/history");
    expect(screen.queryByRole("link", { name: /importar/i, hidden: true })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /mapa/i, hidden: true })).toHaveAttribute("href", "/knowledge-map");
    expect(screen.getByRole("navigation", { name: /navegação principal/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.queryByText("Fundação ativa")).not.toBeInTheDocument();
  });
});
