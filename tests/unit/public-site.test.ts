import { describe, expect, it } from "vitest";
import { isHybridSignIn } from "@/features/auth/account-mode";
import { hashAccessCode } from "@/features/auth/code-accounts";
import { isPublicRuntimePath } from "@/features/auth/session-guard";
import { accessLastDay } from "@/features/public-site/content-summary";
import { getSellerIdentity } from "@/features/public-site/seller";
import { getServerEnv } from "@/lib/env";

const secret = "12345678901234567890123456789012";
const google = { AUTH_SECRET: secret, AUTH_GOOGLE_ID: "google-client-id", AUTH_GOOGLE_SECRET: "google-client-secret" };
const accounts = JSON.stringify([{ id: "account-owner", name: "Dono", role: "ADMIN", code: hashAccessCode("123456") }]);

describe("public sales and legal pages", () => {
  it("lets visitors open the sales and legal pages without a session", () => {
    for (const path of ["/conheca", "/termos", "/privacidade", "/suporte", "/pais-e-escolas", "/robots.txt", "/sitemap.xml", "/opengraph-image", "/opengraph-image-1a2b3c"]) expect(isPublicRuntimePath(path)).toBe(true);
    for (const path of ["/", "/upgrade", "/conheca/x", "/termos-extra", "/suporte/admin", "/lessons/MAT-01"]) expect(isPublicRuntimePath(path)).toBe(false);
  });

  it("shows the last access day as the exam day in Brasília time", () => {
    expect(accessLastDay("2026-11-30T03:00:00.000Z")).toBe("29/11/2026");
  });

  it("publishes seller data only when name, document and e-mail are all set", () => {
    expect(getSellerIdentity(getServerEnv({ ESTUDISC_SELLER_NAME: "Fulano", ESTUDISC_SELLER_DOCUMENT: "000.000.000-00" }))).toBeNull();
    expect(getSellerIdentity(getServerEnv({ ESTUDISC_SELLER_NAME: "Fulano", ESTUDISC_SELLER_DOCUMENT: "000.000.000-00", ESTUDISC_SELLER_EMAIL: "contato@example.com" })))
      .toEqual({ name: "Fulano", document: "000.000.000-00", email: "contato@example.com" });
    expect(() => getServerEnv({ ESTUDISC_SELLER_EMAIL: "not-an-email" })).toThrow();
  });
});

describe("hybrid sign-in (ADR 0061)", () => {
  it("accepts Google sessions next to code accounts only when paid access, Google and accounts are configured", () => {
    expect(isHybridSignIn(getServerEnv({ ...google, ESTUDISC_ACCOUNTS: accounts, FEATURE_PAID_ACCESS: "true" }))).toBe(true);
    expect(isHybridSignIn(getServerEnv({ ...google, ESTUDISC_ACCOUNTS: accounts }))).toBe(false);
    expect(isHybridSignIn(getServerEnv({ AUTH_SECRET: secret, ESTUDISC_ACCOUNTS: accounts, FEATURE_PAID_ACCESS: "true" }))).toBe(false);
    expect(isHybridSignIn(getServerEnv({ ...google, FEATURE_PAID_ACCESS: "true" }))).toBe(false);
  });
});
