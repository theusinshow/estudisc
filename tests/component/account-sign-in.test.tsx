import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AccountSignIn, profileAccountId } from "@/features/auth/account-sign-in";

afterEach(() => vi.unstubAllGlobals());

it("maps the typed profile name with the same slug rule as create-account", () => {
  expect(profileAccountId("Kauã")).toBe("account-kaua");
  expect(profileAccountId("  Ana Clara ")).toBe("account-ana-clara");
  expect(profileAccountId("account-matheus")).toBe("account-matheus");
  expect(profileAccountId("  ")).toBe("");
});

it("never lists profile names and explains where the 6-digit code comes from", async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  render(<AccountSignIn callbackUrl="/" />);
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByRole("textbox", { name: "Nome do perfil" })).toBeVisible();
  expect(screen.getByText(/código de 6 dígitos também vem dessa pessoa/)).toBeVisible();
  expect(screen.getByRole("link", { name: "Peça acesso" })).toHaveAttribute("href", "/suporte?acesso=1");
  expect(screen.queryByText("Código de 6 dígitos")).toBeNull();
  await userEvent.setup().type(screen.getByRole("textbox", { name: "Nome do perfil" }), "Kauã");
  expect(screen.getByText("Código de 6 dígitos")).toBeVisible();
});
