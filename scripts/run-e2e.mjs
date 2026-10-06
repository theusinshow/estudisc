import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const cli = require.resolve("@playwright/test/cli");
// Each project owns a fresh Next process. The memory harness is process-global;
// serial workers alone do not isolate learner evidence across browser projects.
let failed = false;
for (const project of ["chromium", "mobile-chrome"]) {
  const result = spawnSync(process.execPath, [cli, "test", ...process.argv.slice(2), `--project=${project}`, `--output=test-results/${project}`], {
    stdio: "inherit", env: process.env
  });
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
