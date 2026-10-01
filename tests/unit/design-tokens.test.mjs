import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { generateDesignTokenCss } from "../../scripts/generate-design-tokens.mjs";

describe("design token generator", () => {
  it("generates checked-in CSS custom properties from the canonical token source", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "know-os-tokens-"));
    const output = path.join(tempDir, "tokens.css");

    try {
      const result = await generateDesignTokenCss({ output });
      const css = await readFile(output, "utf8");

      expect(result.count).toBeGreaterThan(80);
      expect(css).toContain("GENERATED FILE. DO NOT EDIT MANUALLY.");
      expect(css).toContain("Source: design-system/design-tokens.json");
      expect(css).toContain("--kos-color-ink: #17141F;");
      expect(css).toContain("--kos-focus-color: #3A4FE0;");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
