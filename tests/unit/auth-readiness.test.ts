import { describe, expect, it } from "vitest";

import { isAllowedGoogleEmail, isGoogleAuthConfigured } from "@/features/auth/auth-readiness";
import { getServerEnv } from "@/lib/env";

describe("Google auth readiness", () => {
  it("requires secret, client id and client secret", () => {
    expect(isGoogleAuthConfigured(getServerEnv({}))).toBe(false);
    expect(
      isGoogleAuthConfigured(
        getServerEnv({
          AUTH_SECRET: "12345678901234567890123456789012",
          AUTH_GOOGLE_ID: "google-client-id",
          AUTH_GOOGLE_SECRET: "google-client-secret"
        })
      )
    ).toBe(true);
  });

  it("allows only configured Google e-mail addresses", () => {
    const env = getServerEnv({
      ESTUDISC_ALLOWED_GOOGLE_EMAILS: "owner@example.com"
    });

    expect(isAllowedGoogleEmail("OWNER@example.com", env)).toBe(true);
    expect(isAllowedGoogleEmail("other@example.com", env)).toBe(false);
    expect(isAllowedGoogleEmail(null, env)).toBe(false);
  });
});
