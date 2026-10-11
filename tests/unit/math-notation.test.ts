import { describe, expect, it } from "vitest";

import { numberedSteps, parseMathNotation, type MathSegment } from "@/components/ui/math-notation";

const original = (segments: readonly MathSegment[]) => segments.map(segment => segment.text).join("");
const kinds = (text: string) => parseMathNotation(text).map(segment => segment.kind === "text" ? segment.text : `[${segment.kind}:${segment.text}]`).join("");

describe("math notation contract v1", () => {
  it("always preserves the exact authored text", () => {
    for (const text of ["2⁴ × 2³ = 2⁽⁴⁺³⁾ = 2⁷ = 128.", "(10/21)÷(5/7)=(10/21)×(7/5)", "√(24²+10²)", "Encontra as raízes, mas inverte a ordem +√Δ, −√Δ.", "10/10/2026", "https://proedu.rnp.br/handle/123456789/585?show=full", "Ação, fração, equação, solução, ciência, força, posição, não, revisão."]) {
      expect(original(parseMathNotation(text))).toBe(text);
    }
  });

  it("renders superscript runs with reading-font characters", () => {
    expect(parseMathNotation("aᵐ⁺ⁿ e 10⁻²")).toEqual([
      { kind: "text", text: "a" }, { kind: "sup", text: "ᵐ⁺ⁿ", display: "m+n" }, { kind: "text", text: " e 10" }, { kind: "sup", text: "⁻²", display: "−2" }
    ]);
    expect(kinds("A área é 84 cm².")).toBe("A área é 84 cm[sup:²].");
  });

  it("recognizes integer fractions only", () => {
    expect(kinds("Calcule 1/7 + 1/6.")).toBe("Calcule [frac:1/7] + [frac:1/6].");
    expect(kinds("1/10² = 1/100")).toBe("[frac:1/10²] = [frac:1/100]");
    const [fraction] = parseMathNotation("1/10²");
    expect(fraction).toMatchObject({ kind: "frac", numerator: [{ kind: "text", text: "1" }], denominator: [{ kind: "text", text: "10" }, { kind: "sup", text: "²" }] });
  });

  it("leaves dates, URLs, units, decimals and letter fractions as authored", () => {
    for (const text of ["Prova em 10/10/2026.", "programa oficial 2027/1", "EAJA 2020/2021", "Aula_02.pdf e handle/123456789/585", "6 km/h", "aᵐ/aⁿ", "x/2", "2,5/5", "1/2.5", "24/7h", "R$ 3/kg"]) {
      expect(parseMathNotation(text).some(segment => segment.kind === "frac")).toBe(false);
    }
  });

  it("recognizes unambiguous square roots and leaves ambiguous ones plain", () => {
    expect(kinds("√50 = 5√2 e √9 = 3")).toBe("[root:√50] = 5[root:√2] e [root:√9] = 3");
    expect(kinds("+√Δ, −√Δ")).toBe("+[root:√Δ], −[root:√Δ]");
    expect(kinds("√(24²+10²)")).toBe("[root:√(24²+10²)]");
    expect(kinds("√2x e √x² e √(3")).toBe("√2x e √x[sup:²] e √(3");
    const [root] = parseMathNotation("√(24²+10²)");
    expect(root).toMatchObject({ kind: "root", radicand: [{ text: "24" }, { kind: "sup" }, { text: "+10" }, { kind: "sup" }] });
  });

  it("detects worked numbered steps with lead and closing lines", () => {
    expect(numberedSteps(["Resolva 20 - 2 × (3² - √9).", "1. Potências: 3² = 9.", "2. Subtraia: 9 - 3 = 6.", "Conferência: ok."])).toEqual({ lead: ["Resolva 20 - 2 × (3² - √9)."], start: 1, items: ["Potências: 3² = 9.", "Subtraia: 9 - 3 = 6."], trail: ["Conferência: ok."] });
    expect(numberedSteps(["1. Só um passo."])).toBeNull();
    expect(numberedSteps(["1. a", "3. b"])).toBeNull();
    expect(numberedSteps(["1. a", "2. b", "texto", "3. c"])).toBeNull();
    expect(numberedSteps(["Em 2026. Ano", "Linha"])).toBeNull();
  });
});
