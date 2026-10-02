import { describe, expect, it } from "vitest";
import {
  createAccountSession,
  hashAccessCode,
  parseCodeAccounts,
  publicAccounts,
  readAccountSession,
  verifyAccessCode,
  type CodeAccount
} from "@/features/auth/code-accounts";

const secret = "test-secret-with-enough-entropy";
const account = (id: string, name: string, code: string, role: CodeAccount["role"] = "STUDENT"): CodeAccount => ({ id, name, role, code: hashAccessCode(code) });

describe("code accounts", () => {
  it("hashes codes with a salt and verifies only the right six digits", () => {
    const stored = hashAccessCode("123456");
    expect(stored).not.toContain("123456");
    expect(hashAccessCode("123456")).not.toBe(stored);
    expect(verifyAccessCode("123456", stored)).toBe(true);
    expect(verifyAccessCode("123457", stored)).toBe(false);
    expect(verifyAccessCode("12345", stored)).toBe(false);
    expect(() => hashAccessCode("12a456")).toThrow();
  });

  it("parses the env list, treats empty as off and rejects duplicates or plain codes", () => {
    const list = [account("account-a", "Ana", "111111"), account("account-b", "Bia", "222222", "ADMIN")];
    expect(parseCodeAccounts("")).toBeNull();
    expect(parseCodeAccounts(undefined)).toBeNull();
    expect(parseCodeAccounts(JSON.stringify(list))).toHaveLength(2);
    expect(publicAccounts(list)).toEqual([{ id: "account-a", name: "Ana" }, { id: "account-b", name: "Bia" }]);
    expect(() => parseCodeAccounts(JSON.stringify([list[0], { ...list[1], id: "account-a" }]))).toThrow();
    expect(() => parseCodeAccounts(JSON.stringify([{ ...list[0], code: "111111" }]))).toThrow();
  });

  it("signs sessions that resolve the account and reject tampering, expiry and code changes", () => {
    const ana = account("account-a", "Ana", "111111");
    const token = createAccountSession(ana, secret, 1_000_000);
    expect(readAccountSession(token, [ana], secret, 1_000_000)?.id).toBe("account-a");
    expect(readAccountSession(token, [ana], "other-secret", 1_000_000)).toBeNull();
    expect(readAccountSession(`${token}x`, [ana], secret, 1_000_000)).toBeNull();
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload!, "base64url").toString()), sub: "account-b" })).toString("base64url");
    expect(readAccountSession(`${forged}.${signature}`, [ana], secret, 1_000_000)).toBeNull();
    expect(readAccountSession(token, [ana], secret, 1_000_000 + 31 * 86_400_000)).toBeNull();
    expect(readAccountSession(token, [{ ...ana, code: hashAccessCode("999999") }], secret, 1_000_000)).toBeNull();
    expect(readAccountSession(undefined, [ana], secret)).toBeNull();
  });
});
