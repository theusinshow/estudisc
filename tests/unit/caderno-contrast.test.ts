import { expect, it } from "vitest";
import tokens from "../../design-system/design-tokens.json";

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

it("keeps every ADR 0067 text pairing at WCAG AA (4.5:1) or better", () => {
  const c = tokens.color;
  const pairs: Array<[string, string, string]> = [
    ["signalInk on signal (dominant CTA)", c.signalInk, c.signal],
    ["ink on paper", c.ink, c.paper],
    ["dim on paper (metadata)", c.dim, c.paper],
    ["dim on panel", c.dim, c.panel],
    ["success stamp on panel", c.success, c.panel],
    ["warning stamp on panel", c.warning, c.panel],
    ["info stamp/focus on panel", c.info, c.panel],
    ["paper letter on ink bubble", c.paper, c.ink],
    ...(["violet", "pink", "lime", "orange"] as const).map(name => [`ink on ${name} subject tab`, c.ink, c.surface[name]] as [string, string, string])
  ];
  for (const [name, foreground, background] of pairs) expect(ratio(foreground, background), name).toBeGreaterThanOrEqual(4.5);
});
