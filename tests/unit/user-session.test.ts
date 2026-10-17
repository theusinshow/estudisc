import { expect, it } from "vitest";
import { createUserSession, readUserSession } from "@/features/auth/user-session";

const secret = "x".repeat(40);
it("signs account sessions, rejects tampering, other secrets and expiry", () => {
  const now = Date.parse("2026-10-17T12:00:00Z");
  const token = createUserSession({ id: "account-kaua", role: "STUDENT", sessionVersion: 1 }, secret, now);
  expect(readUserSession(token, secret, now)).toMatchObject({ sub: "account-kaua", role: "STUDENT", sv: 1 });
  const [payload, signature] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ sub: "account-matheus", role: "ADMIN", sv: 1, exp: 9999999999 })).toString("base64url");
  expect(readUserSession(`${forged}.${signature}`, secret, now)).toBeNull();
  expect(readUserSession(`${payload}.${signature}`, "y".repeat(40), now)).toBeNull();
  expect(readUserSession(token, secret, now + 31 * 24 * 3600 * 1000)).toBeNull();
  expect(readUserSession(undefined, secret, now)).toBeNull();
});
