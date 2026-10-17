/** ADMIN-only preview of the vibrante theme across the app (design lab). */
export const THEME_COOKIE = "estudisc_theme";
const PALETTES = ["a", "b", "c"] as const;
const TYPES = ["archivo", "rounded"] as const;

export type LabTheme = Readonly<{ theme: "vibrante"; palette: (typeof PALETTES)[number]; type: (typeof TYPES)[number] }>;

export function parseThemeCookie(value: string | undefined): LabTheme | null {
  const [theme, palette, type] = (value ?? "").split(":");
  if (theme !== "vibrante") return null;
  if (!PALETTES.includes(palette as LabTheme["palette"]) || !TYPES.includes(type as LabTheme["type"])) return null;
  return { theme, palette: palette as LabTheme["palette"], type: type as LabTheme["type"] };
}

export function serializeThemeCookie(theme: LabTheme) {
  return `${theme.theme}:${theme.palette}:${theme.type}`;
}

export function themeAttributes(theme: LabTheme | null): Record<string, string> {
  return theme ? { "data-theme": theme.theme, "data-palette": theme.palette, "data-type": theme.type } : {};
}
