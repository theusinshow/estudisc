import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3210",
    trace: "on-first-retry"
  },
  webServer: {
    command: "pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3210",
    env: {
      ...process.env,
      APP_URL: "",
      AUTH_GOOGLE_ID: "",
      AUTH_GOOGLE_SECRET: "",
      AUTH_SECRET: "test-auth-secret-do-not-use",
      AUTH_TRUST_HOST: "true",
      DATABASE_URL: process.env.DATABASE_URL ?? "memory://local",
      ESTUDISC_ALLOWED_GOOGLE_EMAILS: "",
      // Code accounts from .env.local stay off; E2E covers the owner flow without a login.
      ESTUDISC_ACCOUNTS: "",
      ESTUDISC_OWNER_ID: process.env.ESTUDISC_OWNER_ID ?? "local-owner"
    },
    url: "http://127.0.0.1:3210",
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] }
    }
  ]
});
