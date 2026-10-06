import { afterEach, describe, expect, it, vi } from "vitest";

import { checkDatabaseHealth } from "@/db/health";
import { getServerEnv } from "@/lib/env";

describe("server environment validation", () => {
  it("defaults the local owner and log level without requiring secrets", () => {
    expect(getServerEnv({})).toMatchObject({
      ESTUDISC_OWNER_ID: "local-owner",
      LOG_LEVEL: "info"
    });
  });
});

describe("database health", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("reports a safe not-configured state when DATABASE_URL is absent", async () => {
    vi.stubEnv("DATABASE_URL", "");

    await expect(checkDatabaseHealth()).resolves.toMatchObject({
      status: "not_configured"
    });
  });
});
