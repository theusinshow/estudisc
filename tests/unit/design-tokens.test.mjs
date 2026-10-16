import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { generateDesignTokenCss } from "../../scripts/generate-design-tokens.mjs";

describe("design token generator", () => {
  it("generates checked-in CSS custom properties from the canonical token source", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "estudisc-tokens-"));
    const output = path.join(tempDir, "tokens.css");

    try {
      const result = await generateDesignTokenCss({ output });
      const css = await readFile(output, "utf8");

      expect(result.count).toBeGreaterThan(80);
      expect(css).toContain("GENERATED FILE. DO NOT EDIT MANUALLY.");
      expect(css).toContain("Source: design-system/design-tokens.json");
      expect(css).toContain("--estudisc-color-ink: #17141F;");
      expect(css).toContain("--estudisc-focus-color: #3A4FE0;");
      // ADR 0067: three elevation levels, motion that communicates state, exam-grid at ≤ 6% opacity.
      expect(css).toContain("--estudisc-elevation-structure-shadow: none;");
      expect(css).toContain("--estudisc-elevation-surface-shadow: 4px 4px 0 #17141F;");
      expect(css).toContain("--estudisc-elevation-action-shadow: 6px 6px 0 #17141F;");
      expect(css).toContain("--estudisc-motion-press: 90ms;");
      expect(css).toContain("--estudisc-pattern-grid-color: rgba(23,20,31,0.06);");
      expect(css).toContain("--estudisc-focus-width: 3px;");

      const checkedIn = await readFile(path.join(process.cwd(), "src", "styles", "generated", "design-tokens.css"), "utf8");
      expect(checkedIn.replace(/\r\n/g, "\n")).toBe(css.replace(/\r\n/g, "\n"));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
