import tokens from "../../../design-system/design-tokens.json";

export type LabPalette = "a" | "b" | "c";
type Palette = LabPalette | "current";
export type ContrastPair = Readonly<{ label: string; foreground: string; background: string; ratio: number; passes: boolean }>;

type ColorTokens = { ink: string; paper: string; panel: string; dim: string; signal: string; signalInk: string; subjectAccent: Record<string, string> };
type ThemeTokens = { base: { color: Partial<ColorTokens> }; palettes: Record<string, { color: Partial<ColorTokens> }> };

function channel(value: number) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG 2 contrast ratio between two #RRGGBB colors. */
export function contrastRatio(foreground: string, background: string) {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Text-relevant colors of the current theme or a vibrante palette ("a" is the vibrante base). */
export function resolveThemeColors(palette: Palette): Record<string, string> {
  const root = tokens.color as unknown as ColorTokens;
  const vibrante = (tokens as unknown as { themes: { vibrante: ThemeTokens } }).themes.vibrante;
  const merged: ColorTokens = palette === "current"
    ? root
    : {
        ...root,
        ...vibrante.base.color,
        ...(palette === "a" ? {} : vibrante.palettes[palette]?.color),
        subjectAccent: { ...root.subjectAccent, ...vibrante.base.color.subjectAccent }
      };
  const flat: Record<string, string> = { ink: merged.ink, paper: merged.paper, panel: merged.panel, dim: merged.dim, signal: merged.signal, signalInk: merged.signalInk };
  for (const [key, value] of Object.entries(merged.subjectAccent)) flat[`subject.${key}`] = value;
  return flat;
}

const SUBJECT_LABELS: Record<string, string> = { mathematics: "Matemática", science: "Ciências", portuguese: "Português", historyGeography: "Geografia e História" };

export function contrastReport(palette: Palette): ContrastPair[] {
  const c = resolveThemeColors(palette);
  const pairs: Array<[string, string, string]> = [
    ["texto sobre fundo", c.ink, c.paper],
    ["texto sobre folha", c.ink, c.panel],
    ["texto secundário sobre fundo", c.dim, c.paper],
    ["texto secundário sobre folha", c.dim, c.panel],
    ["texto sobre amarelo de ação", c.signalInk, c.signal],
    ...Object.entries(SUBJECT_LABELS).map(([key, label]): [string, string, string] => [`texto sobre ${label}`, c.ink, c[`subject.${key}`]])
  ];
  return pairs.map(([label, foreground, background]) => {
    const ratio = contrastRatio(foreground, background);
    return { label, foreground, background, ratio, passes: ratio >= 4.5 };
  });
}
