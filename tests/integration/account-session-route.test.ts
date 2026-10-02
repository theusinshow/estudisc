import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_SESSION_COOKIE, hashAccessCode, readAccountSession, type CodeAccount } from "@/features/auth/code-accounts";

const secret = "integration-secret-with-32-or-more-chars";
const accounts: CodeAccount[] = [
  { id: "account-ana", name: "Ana", role: "ADMIN", code: hashAccessCode("141414") },
  { id: "account-bia", name: "Bia", role: "STUDENT", code: hashAccessCode("252525") }
];
const login = (accountId: string, code: string, ip = "10.0.0.1") =>
  new Request("http://localhost/api/session", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify({ accountId, code }) });

describe("POST/DELETE /api/session", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("KNOW_OS_ACCOUNTS", JSON.stringify(accounts));
    vi.stubEnv("AUTH_SECRET", secret);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("signs in with the right code and sets an httpOnly session cookie for that account only", async () => {
    const { POST } = await import("@/app/api/session/route");
    const response = await POST(login("account-bia", "252525"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: "Bia", role: "STUDENT" });
    const cookie = response.cookies.get(ACCOUNT_SESSION_COOKIE);
    expect(cookie?.httpOnly).toBe(true);
    expect(readAccountSession(cookie?.value, accounts, secret)?.id).toBe("account-bia");
  });

  it("rejects a wrong code or unknown account and locks after five failures", async () => {
    const { POST } = await import("@/app/api/session/route");
    expect((await POST(login("account-ghost", "252525", "10.0.0.2"))).status).toBe(401);
    for (let attempt = 0; attempt < 5; attempt++) expect((await POST(login("account-ana", "000000", "10.0.0.3"))).status).toBe(401);
    const locked = await POST(login("account-ana", "141414", "10.0.0.3"));
    expect(locked.status).toBe(429);
    expect(locked.headers.get("Retry-After")).toBeTruthy();
    expect((await POST(login("account-ana", "141414", "10.0.0.4"))).status).toBe(200);
  });

  it("is disabled without accounts and clears the cookie on sign-out", async () => {
    vi.stubEnv("KNOW_OS_ACCOUNTS", "");
    const { POST, DELETE } = await import("@/app/api/session/route");
    expect((await POST(login("account-ana", "141414"))).status).toBe(404);
    const signedOut = await DELETE();
    expect(signedOut.headers.get("set-cookie")).toContain(`${ACCOUNT_SESSION_COOKIE}=;`);
  });
});
