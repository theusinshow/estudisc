import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock("@/auth", () => ({ signIn: mocks.signIn }));

import { redirect } from "next/navigation";
import { verifyEmailCodeAction } from "@/features/auth/email-code-actions";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => { mocks.signIn.mockReset(); });

it("passes the submitted email and code to the email-code provider with a safe callback", async () => {
  mocks.signIn.mockImplementation(async () => redirect("/hoje"));
  await expect(verifyEmailCodeAction({ step: "code", email: "" }, form({ email: "a@example.com", code: "123456", requestId: "r1", callbackUrl: "//evil.example" }))).rejects.toThrow();
  expect(mocks.signIn).toHaveBeenCalledWith("email-code", { email: "a@example.com", code: "123456", redirectTo: "/" });
});

it("turns an Auth.js rejection into a message tied to the request", async () => {
  mocks.signIn.mockRejectedValue(Object.assign(new Error("CredentialsSignin"), { type: "CredentialsSignin" }));
  const state = await verifyEmailCodeAction({ step: "code", email: "" }, form({ email: "a@example.com", code: "000000", requestId: "r1", callbackUrl: "/" }));
  expect(state).toMatchObject({ step: "code", email: "a@example.com", requestId: "r1" });
  expect(state.error).toContain("Código incorreto");
});

it("does not hide unexpected failures", async () => {
  mocks.signIn.mockRejectedValue(new Error("database down"));
  await expect(verifyEmailCodeAction({ step: "code", email: "" }, form({ email: "a@example.com", code: "000000" }))).rejects.toThrow("database down");
});
