import { describe, expect, it } from "vitest";

import { getAuthGuardDecision, isPublicRuntimePath } from "@/features/auth/session-guard";
import { getServerEnv } from "@/lib/env";

const configuredEnv = getServerEnv({
  AUTH_SECRET: "12345678901234567890123456789012",
  AUTH_GOOGLE_ID: "google-client-id",
  AUTH_GOOGLE_SECRET: "google-client-secret",
  ESTUDISC_ALLOWED_GOOGLE_EMAILS: "owner@example.com"
});

describe("session guard", () => {
  it("allows local development when Google auth is not configured", () => {
    expect(getAuthGuardDecision(undefined, getServerEnv({}))).toBe("allow");
  });

  it("requires a session when Google auth is configured", () => {
    expect(getAuthGuardDecision(undefined, configuredEnv)).toBe("unauthenticated");
  });

  it("allows only configured Google accounts", () => {
    expect(getAuthGuardDecision("owner@example.com", configuredEnv)).toBe("allow");
    expect(getAuthGuardDecision("other@example.com", configuredEnv)).toBe("forbidden");
  });

  it("keeps auth, health and branding paths public", () => {
    expect(isPublicRuntimePath("/api/auth/signin")).toBe(true);
    expect(isPublicRuntimePath("/auth/signin")).toBe(true);
    expect(isPublicRuntimePath("/api/health/db")).toBe(true);
    expect(isPublicRuntimePath("/branding/vecta-mark.svg")).toBe(true);
    expect(isPublicRuntimePath("/api/export")).toBe(false);
  });
});
