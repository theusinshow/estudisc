import { describe, expect, it } from "vitest";

import { getServerEnv } from "@/lib/env";

describe("server environment contract", () => {
  it("keeps auth variables optional for local development", () => {
    expect(getServerEnv({})).toMatchObject({
      AUTH_GOOGLE_ID: undefined,
      AUTH_GOOGLE_SECRET: undefined,
      AUTH_SECRET: undefined,
      AUTH_TRUST_HOST: undefined,
      DEEPSEEK_API_KEY: undefined,
      DEEPSEEK_BASE_URL: "https://api.deepseek.com",
      DEEPSEEK_DEFAULT_MODEL: "deepseek-v4-flash",
      DEEPSEEK_PRO_MODEL: "deepseek-v4-pro",
      ESTUDISC_ALLOWED_GOOGLE_EMAILS: [],
      ESTUDISC_OWNER_ID: "local-owner"
    });
  });

  it("parses the Google e-mail allowlist", () => {
    expect(
      getServerEnv({
        ESTUDISC_ALLOWED_GOOGLE_EMAILS: " Owner@Example.com,second@example.com "
      }).ESTUDISC_ALLOWED_GOOGLE_EMAILS
    ).toEqual(["owner@example.com", "second@example.com"]);
  });

  it("treats blank optional production variables as absent", () => {
    expect(
      getServerEnv({
        APP_URL: "",
        AUTH_GOOGLE_ID: "",
        AUTH_GOOGLE_SECRET: "",
        AUTH_SECRET: "",
        AUTH_TRUST_HOST: "",
        DATABASE_URL: "",
        DEEPSEEK_API_KEY: "",
        DEEPSEEK_BASE_URL: "",
        DEEPSEEK_DEFAULT_MODEL: "",
        DEEPSEEK_PRO_MODEL: "",
        ESTUDISC_ALLOWED_GOOGLE_EMAILS: ""
      })
    ).toMatchObject({
      APP_URL: undefined,
      AUTH_GOOGLE_ID: undefined,
      AUTH_GOOGLE_SECRET: undefined,
      AUTH_SECRET: undefined,
      AUTH_TRUST_HOST: undefined,
      DATABASE_URL: undefined,
      DEEPSEEK_API_KEY: undefined,
      DEEPSEEK_BASE_URL: "https://api.deepseek.com",
      DEEPSEEK_DEFAULT_MODEL: "deepseek-v4-flash",
      DEEPSEEK_PRO_MODEL: "deepseek-v4-pro",
      ESTUDISC_ALLOWED_GOOGLE_EMAILS: []
    });
  });

  it("rejects invalid allowed Google e-mail entries", () => {
    expect(() => getServerEnv({ ESTUDISC_ALLOWED_GOOGLE_EMAILS: "not-an-email" })).toThrow();
  });

  it("parses Auth.js trusted-host setting for hosted reverse proxies", () => {
    expect(getServerEnv({ AUTH_TRUST_HOST: "true" }).AUTH_TRUST_HOST).toBe(true);
    expect(() => getServerEnv({ AUTH_TRUST_HOST: "yes" })).toThrow();
  });

  it("rejects retired DeepSeek model aliases", () => {
    expect(() => getServerEnv({ DEEPSEEK_DEFAULT_MODEL: "deepseek-chat" })).toThrow();
    expect(() => getServerEnv({ DEEPSEEK_PRO_MODEL: "deepseek-reasoner" })).toThrow();
  });
});
