import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { EmailSignIn, SignupForm } from "@/features/auth/email-account-forms";

afterEach(() => vi.unstubAllGlobals());
const reply = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

it("asks for the e-mail, then the 6-digit code, and offers sign-up when the inbox has no account", async () => {
  const fetch = vi.fn().mockReturnValueOnce(reply(200, { status: "sent" })).mockReturnValueOnce(reply(404, { code: "no_account" }));
  vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup();
  render(<EmailSignIn callbackUrl="/" signupOpen />);
  await user.type(screen.getByRole("textbox", { name: "E-mail" }), "Ana@Example.com");
  await user.click(screen.getByRole("button", { name: "Receber código" }));
  expect(await screen.findByText(/Código enviado para/)).toHaveTextContent("ana@example.com");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: "Ana@Example.com", intent: "signin" });
  await user.keyboard("123456");
  expect(await screen.findByRole("link", { name: "Criar conta com esse e-mail" })).toHaveAttribute("href", "/auth/cadastro?email=ana%40example.com");
});

it("requires the guardian declaration for minors and the terms before sending a sign-up code", async () => {
  const fetch = vi.fn().mockReturnValue(reply(200, { status: "sent" }));
  vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup();
  render(<SignupForm initialEmail="bia@example.com" />);
  await user.type(screen.getByRole("textbox", { name: "Seu nome" }), "Bia");
  await user.click(screen.getByRole("radio", { name: "Tenho menos de 18 anos" }));
  await user.click(screen.getByRole("button", { name: "Criar conta e receber código" }));
  expect(screen.getByRole("alert")).toHaveTextContent("responsável autorizou");
  await user.click(screen.getByRole("checkbox", { name: /responsável sabe/ }));
  await user.click(screen.getByRole("button", { name: "Criar conta e receber código" }));
  expect(screen.getByRole("alert")).toHaveTextContent("aceite os termos");
  expect(fetch).not.toHaveBeenCalled();
  await user.click(screen.getByRole("checkbox", { name: /termos de uso/ }));
  await user.click(screen.getByRole("button", { name: "Criar conta e receber código" }));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: "bia@example.com", intent: "signup", signup: { name: "Bia", minor: true, guardianAuthorized: true, acceptTerms: true } });
});
