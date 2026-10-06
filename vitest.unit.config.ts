import { defineConfig } from "vitest/config";
import base from "./vitest.config";
export default defineConfig({ ...base, test: { ...base.test, include: ["tests/unit/**/*.{test,spec}.{ts,tsx,mjs}","tests/component/**/*.{test,spec}.{ts,tsx}"], maxWorkers: 2, testTimeout: 15000 } });
