import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "@/lib/security-headers";

describe("buildContentSecurityPolicy", () => {
  it("uses nonce-based script sources without production unsafe inline or eval", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "abc123",
      isDevelopment: false
    });

    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic' https://insights.codedbym.com");
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("style-src 'self' 'nonce-abc123'");
    expect(policy).toContain("frame-src https://accounts.google.com");
    expect(policy).toContain(
      "connect-src 'self' ws: wss: https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://insights.codedbym.com"
    );
  });

  it("allows eval only for the local Next.js development server", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "dev123",
      isDevelopment: true
    });

    expect(policy).toContain("script-src 'self' 'nonce-dev123' 'strict-dynamic' https://insights.codedbym.com 'unsafe-eval'");
    expect(policy).not.toContain("'unsafe-inline'");
  });
});
