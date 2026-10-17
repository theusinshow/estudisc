import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/layout/app-shell";

describe("AppShell", () => {
  it("offers four tabs around a central Continuar action, with no hidden More menu", () => {
    render(<AppShell><h1>Hoje</h1></AppShell>);
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hoje" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Estudar" })).toHaveAttribute("href", "/tracks");
    expect(screen.getByRole("link", { name: "Continuar de onde parei" })).toHaveAttribute("href", "/continuar");
    expect(screen.getByRole("link", { name: "Provas" })).toHaveAttribute("href", "/provas");
    expect(screen.getByRole("link", { name: "Você" })).toHaveAttribute("href", "/voce");
    expect(screen.queryByText("Mais")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /perfil/i })).not.toBeInTheDocument();
  });

  it("keeps an explicit exit and main landmark while hiding global navigation in Focus", () => {
    render(<AppShell mode="focus" exit={{ href: "/tracks", label: "Voltar à trilha" }}><h1>Aula</h1></AppShell>);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar à trilha" })).toHaveAttribute("href", "/tracks");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("link", { name: /pular para o conteúdo/i })).toHaveAttribute("href", "#main-content");
  });

  it("keeps the brand link to Today", () => {
    render(<AppShell><h1>Conteúdo principal</h1></AppShell>);
    expect(screen.getByRole("link", { name: "Estudisc, página inicial" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
