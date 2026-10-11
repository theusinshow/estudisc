import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/app-shell";

// The shell reads the owner profile on the server; tests use a STUDENT so admin links stay hidden.
vi.mock("@/features/auth/owner", () => ({ getOwnerProfile: async () => ({ ownerId: "student-test", role: "STUDENT", name: "Aluno" }) }));

afterEach(() => vi.unstubAllEnvs());

describe("AppShell", () => {
  it("promotes real study destinations while retaining secondary pages in a closed sheet", async () => {
    vi.stubEnv("FEATURE_STUDY_PLANNER", "true");
    render(await AppShell({ children: <h1>Hoje</h1> }));
    expect(screen.getByRole("link", { name: "Plano" })).toHaveAttribute("href", "/plan");
    expect(screen.getByRole("link", { name: "Revisar" })).toHaveAttribute("href", "/review");
    expect(screen.queryByText("Mais")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir perfil e outras páginas" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps an explicit exit and main landmark while hiding global navigation in Focus", async () => {
    render(await AppShell({ mode: "focus", exit: { href: "/tracks", label: "Voltar à trilha" }, children: <h1>Aula</h1> }));
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar à trilha" })).toHaveAttribute("href", "/tracks");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("link", { name: /pular para o conteúdo/i })).toBeInTheDocument();
  });

  it("renders the accessible foundation shell without claiming product screens are complete", async () => {
    render(await AppShell({ children: <h1>Conteúdo principal</h1> }));

    expect(screen.getByRole("link", { name: /pular para o conteúdo principal/i })).toHaveAttribute(
      "href",
      "#main-content"
    );
    expect(screen.getByRole("link", { name: "Estudisc, página inicial" })).toBeInTheDocument();
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

describe("AppShell profile", () => {
  it("shows administrative destinations only for an ADMIN profile resolved on the server", async () => {
    const owner = await import("@/features/auth/owner");
    vi.spyOn(owner, "getOwnerProfile").mockResolvedValueOnce({ ownerId: "admin-test", role: "ADMIN" });
    render(await AppShell({ children: <h1>Hoje</h1> }));
    expect(screen.getByRole("link", { name: /importar/i, hidden: true })).toHaveAttribute("href", "/import");
  });
});
