import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { hashAccessCode } from "@/features/auth/code-accounts";

vi.mock("@/auth", () => ({ signIn: vi.fn() }));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it("shows no profile name to a signed-out visitor in profile mode", async () => {
  const accounts = [{ id: "account-matheus", name: "Matheus", role: "ADMIN", code: hashAccessCode("123456") }, { id: "account-kaua", name: "Kauã", role: "STUDENT", code: hashAccessCode("654321") }];
  vi.stubEnv("ESTUDISC_ACCOUNTS", JSON.stringify(accounts));
  vi.stubEnv("AUTH_SECRET", "x".repeat(40));
  const { default: SignInPage } = await import("@/app/auth/signin/page");
  const html = renderToStaticMarkup(await SignInPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Nome do perfil");
  expect(html).not.toMatch(/Matheus|Kauã|account-matheus|account-kaua/);
});
