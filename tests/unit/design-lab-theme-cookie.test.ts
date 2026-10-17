import { describe, expect, it } from "vitest";

import { parseThemeCookie, serializeThemeCookie, themeAttributes } from "@/features/design-lab/theme-cookie";

describe("theme cookie", () => {
  it("round-trips a valid theme", () => {
    const theme = { theme: "vibrante", palette: "b", type: "rounded" } as const;
    expect(parseThemeCookie(serializeThemeCookie(theme))).toEqual(theme);
  });

  it("ignores missing or unknown values", () => {
    expect(parseThemeCookie(undefined)).toBeNull();
    expect(parseThemeCookie("")).toBeNull();
    expect(parseThemeCookie("vibrante:z:archivo")).toBeNull();
    expect(parseThemeCookie("dark:a:archivo")).toBeNull();
    expect(parseThemeCookie("vibrante:a:comic")).toBeNull();
  });

  it("maps to html attributes", () => {
    expect(themeAttributes(null)).toEqual({});
    expect(themeAttributes({ theme: "vibrante", palette: "a", type: "archivo" })).toEqual({ "data-theme": "vibrante", "data-palette": "a", "data-type": "archivo" });
  });
});
