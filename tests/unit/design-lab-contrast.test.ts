import { describe, expect, it } from "vitest";

import { contrastRatio, contrastReport } from "@/features/design-lab/contrast";

describe("design lab contrast", () => {
  it("computes WCAG ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it.each(["a", "b", "c"] as const)("vibrante palette %s passes AA for every text pair", (palette) => {
    const failing = contrastReport(palette).filter((pair) => !pair.passes);
    expect(failing).toEqual([]);
  });

  it("reports the pairs it checks", () => {
    const labels = contrastReport("a").map((pair) => pair.label);
    expect(labels).toContain("texto sobre fundo");
    expect(labels).toContain("texto sobre Matemática");
  });
});
