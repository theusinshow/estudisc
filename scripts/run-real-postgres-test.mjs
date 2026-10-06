import { spawn } from "node:child_process";

const command =
  process.platform === "win32"
    ? "pnpm exec vitest run tests/integration/real-postgres.test.ts"
    : "pnpm";
const args = process.platform === "win32" ? [] : ["exec", "vitest", "run", "tests/integration/real-postgres.test.ts"];
const child = spawn(command, args, {
  env: {
    ...process.env,
    ESTUDISC_RUN_REAL_POSTGRES_TESTS: "1"
  },
  shell: process.platform === "win32",
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
