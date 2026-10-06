import { afterEach, expect, it, vi } from "vitest";
import { logEvent } from "@/lib/logger";
afterEach(() => vi.restoreAllMocks());
it("logs operational metadata without credentials, cookies, answers or arbitrary request data", () => {
  const output = vi.spyOn(console, "error").mockImplementation(() => {});
  logEvent("error", "unexpected_api_5xx", { statusCode: 500, operation: "import", password: "private-password", authSecret: "private-secret", cookie: "private-cookie", answer: "private-answer", providerKey: "private-key", request: { private: true } });
  const message = String(output.mock.calls[0][0]);
  expect(JSON.parse(message)).toMatchObject({ product: "Estudisc", statusCode: 500, operation: "import" });
  expect(message).not.toContain("private");
});
