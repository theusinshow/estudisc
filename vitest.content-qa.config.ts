import { defineConfig } from "vitest/config";
import base from "./vitest.config";
export default defineConfig({ ...base, test: { ...base.test, include: ["tests/science-*.test.{ts,tsx}","tests/gh-*.test.{ts,tsx}","tests/history-geography-import.test.tsx","tests/portuguese-import.test.tsx"], maxWorkers: 1, testTimeout: 90000 } });
