import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    maxWorkers: 4,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    testTimeout: 15000,
    include: ["tests/**/*.{test,spec}.{ts,tsx,mjs}"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
