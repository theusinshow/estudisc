import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    "**/.next/**",
    ".local/**",
    "node_modules/**",
    "coverage/**",
    "**/design-system/**/*.js",
    "playwright-report/**",
    "test-results/**",
    "src/styles/generated/**"
  ])
]);
