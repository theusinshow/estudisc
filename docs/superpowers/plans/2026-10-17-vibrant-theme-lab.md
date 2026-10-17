# Vibrant Theme Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An ADMIN-only design lab plus a token-level "vibrante" theme that can be previewed side by side and across the whole app, without any student-visible change.

**Architecture:** `design-system/design-tokens.json` gains a `themes.vibrante` override block (base + palettes). The token generator emits it as attribute-scoped CSS (`[data-theme="vibrante"]`, `[data-theme="vibrante"][data-palette="b"]`) overriding the same `--estudisc-*` variables. Shape/type treatments live in `src/styles/themes/vibrante.css`. The root layout sets the attributes from a cookie only for ADMIN. `/admin/lab` renders real components in both themes.

**Tech Stack:** Next.js (this repo's version — read `node_modules/next/dist/docs/` before touching Next APIs), React, TypeScript strict, Vitest, Playwright, `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-10-17-vibrant-theme-lab-design.md`

## Global Constraints

- No student-visible change: `data-theme` is set only when the profile role is `ADMIN`.
- The current theme stays the default and its token values are unchanged.
- Every vibrant text/background pair passes WCAG AA (4.5:1 normal text).
- Fonts load through `next/font/google` (self-hosted; CSP `font-src 'self'` unchanged).
- Reduced motion keeps disabling animations.
- UI copy in Portuguese; code identifiers in English.
- Route is `/admin/lab` (not `/lab`), so the existing proxy admin guard (`isAdminRuntimePath` matches `/admin*`) protects it.
- Do not edit files another agent has uncommitted changes in; check `git status` before each commit and stage explicit paths only.
- Push to `main` only after the owner approves.

---

### Task 1: Theme tokens and generator output

**Files:**
- Modify: `design-system/design-tokens.json` (add top-level `themes`)
- Modify: `scripts/generate-design-tokens.mjs`
- Modify: `src/styles/generated/design-tokens.css` (regenerated)
- Test: `tests/unit/design-tokens.test.mjs`

**Interfaces:**
- Produces: CSS selectors `[data-theme="vibrante"]` (palette a = base) and `[data-theme="vibrante"][data-palette="b"|"c"]`; JSON shape `themes.vibrante.base` and `themes.vibrante.palettes.{b,c}` (same key paths as the root tokens, e.g. `color.paper`).

- [ ] **Step 1: Write the failing test** — append to the existing `describe` in `tests/unit/design-tokens.test.mjs`:

```js
  it("emits the vibrante theme as attribute-scoped overrides", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "estudisc-tokens-"));
    const output = path.join(tempDir, "tokens.css");
    try {
      await generateDesignTokenCss({ output });
      const css = await readFile(output, "utf8");
      expect(css).toContain('[data-theme="vibrante"] {');
      expect(css).toContain('[data-theme="vibrante"][data-palette="b"] {');
      expect(css).toContain('[data-theme="vibrante"][data-palette="c"] {');
      expect(css).toMatch(/\[data-theme="vibrante"\] \{[^}]*--estudisc-color-paper: #D4FF4F;/);
      expect(css).toMatch(/\[data-theme="vibrante"\] \{[^}]*--estudisc-color-subject-accent-mathematics: #FF7357;/);
      // The default theme is untouched and `themes` never leaks into :root.
      expect(css).toMatch(/:root \{[^}]*--estudisc-color-paper: #FFF4E0;/);
      expect(css).not.toContain("--estudisc-themes-");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/design-tokens.test.mjs`
Expected: FAIL (no `[data-theme="vibrante"]` in output).

- [ ] **Step 3: Add the theme tokens** — add this top-level key to `design-system/design-tokens.json` (keep every existing key unchanged):

```json
"themes": {
  "vibrante": {
    "base": {
      "color": {
        "paper": "#D4FF4F",
        "dimmedPaper": "#E6FF99",
        "desk": "#C2F03A",
        "panel": "#FFFFFF",
        "dim": "#3A3544",
        "signal": "#FFE135",
        "signalInk": "#17141F",
        "subjectAccent": {
          "mathematics": "#FF7357",
          "science": "#4CC96B",
          "portuguese": "#B08CFF",
          "historyGeography": "#FFD12E"
        },
        "surface": { "lime": "#D4FF4F", "pink": "#FF9AD5", "sky": "#7FD6FF", "orange": "#FF9E5E", "violet": "#B08CFF" }
      },
      "radius": { "sm": "10px", "md": "14px", "interactive": "16px", "learningCard": "24px", "sheet": "28px" },
      "typography": {
        "display": { "weight": 900 },
        "body": { "weights": { "regular": 500, "semibold": 700, "bold": 800 } }
      }
    },
    "palettes": {
      "b": { "color": { "paper": "#C9B8FF", "dimmedPaper": "#E2D8FF", "desk": "#B6A0FF" } },
      "c": { "color": { "paper": "#FFC2A1", "dimmedPaper": "#FFE0CF", "desk": "#FFAF85" } }
    }
  }
}
```

Before writing, run `node -e "const t=require('./design-system/design-tokens.json');console.log(JSON.stringify(t.color.surface))"`; if `color.surface` has different keys, use exactly those keys (keep values above for the ones that match, pick a saturated equivalent for any other key).

- [ ] **Step 4: Emit theme blocks** — in `scripts/generate-design-tokens.mjs`, exclude `themes` from the root collection and append theme blocks. Replace the body of `generateDesignTokenCss` from `const entries = …` through the `css` array with:

```js
  const { themes = {}, ...rootTokens } = tokens;
  const entries = collectTokens(rootTokens, tokens).sort(([left], [right]) => left.localeCompare(right));
  const block = (selector, list) => [`${selector} {`, ...list.map(([name, value]) => `  ${name}: ${value};`), "}"];
  const themeBlocks = Object.entries(themes).flatMap(([themeName, theme]) => {
    const base = collectTokens(theme.base ?? {}, tokens).sort(([a], [b]) => a.localeCompare(b));
    const palettes = Object.entries(theme.palettes ?? {}).flatMap(([palette, overrides]) =>
      block(`[data-theme="${themeName}"][data-palette="${palette}"]`, collectTokens(overrides, tokens).sort(([a], [b]) => a.localeCompare(b)))
    );
    return [...block(`[data-theme="${themeName}"]`, base), ...palettes];
  });

  const css = [
    "/*",
    " * GENERATED FILE. DO NOT EDIT MANUALLY.",
    " * Source: design-system/design-tokens.json",
    ` * Generated by: scripts/${path.basename(fileURLToPath(import.meta.url))}`,
    " */",
    ...block(":root", entries),
    ...themeBlocks,
    ""
  ].join("\n");
```

Keep `return { count: entries.length, output };` unchanged.

- [ ] **Step 5: Regenerate and run tests**

Run: `pnpm generate:tokens && pnpm vitest run tests/unit/design-tokens.test.mjs`
Expected: PASS (both the old test, which compares the checked-in file, and the new one).

- [ ] **Step 6: Commit**

```bash
git add design-system/design-tokens.json scripts/generate-design-tokens.mjs src/styles/generated/design-tokens.css tests/unit/design-tokens.test.mjs
git commit -m "feat(design-system): vibrante theme tokens emitted as attribute-scoped overrides"
```

---

### Task 2: Contrast checker with AA guarantee

**Files:**
- Create: `src/features/design-lab/contrast.ts`
- Test: `tests/unit/design-lab-contrast.test.ts`

**Interfaces:**
- Consumes: `themes.vibrante` JSON shape from Task 1.
- Produces:
  - `contrastRatio(foreground: string, background: string): number` (hex `#RRGGBB`)
  - `type ContrastPair = { label: string; foreground: string; background: string; ratio: number; passes: boolean }`
  - `resolveThemeColors(palette: "a" | "b" | "c" | "current"): Record<string, string>` — flat map like `{ ink, paper, panel, dim, signal, "subject.mathematics", … }`
  - `contrastReport(palette: "a" | "b" | "c" | "current"): ContrastPair[]`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/design-lab-contrast.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
import tokens from "../../../design-system/design-tokens.json";

type Palette = "a" | "b" | "c" | "current";
export type ContrastPair = Readonly<{ label: string; foreground: string; background: string; ratio: number; passes: boolean }>;

function channel(value: number) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(foreground: string, background: string) {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

type ColorTokens = { ink: string; paper: string; panel: string; dim: string; signal: string; signalInk: string; subjectAccent: Record<string, string> };

export function resolveThemeColors(palette: Palette): Record<string, string> {
  const root = tokens.color as unknown as ColorTokens;
  const vibrante = (tokens as unknown as { themes: { vibrante: { base: { color: Partial<ColorTokens> }; palettes: Record<string, { color: Partial<ColorTokens> }> } } }).themes.vibrante;
  const merged: ColorTokens = palette === "current"
    ? root
    : { ...root, ...vibrante.base.color, ...(palette === "a" ? {} : vibrante.palettes[palette]?.color), subjectAccent: { ...root.subjectAccent, ...vibrante.base.color.subjectAccent } };
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
    ...Object.entries(SUBJECT_LABELS).map(([key, label]) => [`texto sobre ${label}`, c.ink, c[`subject.${key}`]] as [string, string, string])
  ];
  return pairs.map(([label, foreground, background]) => {
    const ratio = contrastRatio(foreground, background);
    return { label, foreground, background, ratio, passes: ratio >= 4.5 };
  });
}
```

If `tsc` rejects the JSON import, check `tsconfig.json` has `"resolveJsonModule": true`; it is needed and safe to add.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/design-lab-contrast.test.ts`
Expected: PASS. If a palette pair fails, adjust that color in `themes.vibrante` (darken `dim`, or deepen a subject color) and re-run `pnpm generate:tokens`; do not lower the threshold.

- [ ] **Step 5: Commit**

```bash
git add src/features/design-lab/contrast.ts tests/unit/design-lab-contrast.test.ts design-system/design-tokens.json src/styles/generated/design-tokens.css
git commit -m "feat(design-lab): WCAG contrast report with AA guarantee for vibrante palettes"
```

---

### Task 3: Admin-only theme cookie, fonts and layout wiring

**Files:**
- Create: `src/features/design-lab/theme-cookie.ts`
- Create: `src/styles/themes/vibrante.css` (empty scaffold with a header comment; filled in Task 4)
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (import the theme file last)
- Test: `tests/unit/design-lab-theme-cookie.test.ts`

**Interfaces:**
- Produces:
  - `THEME_COOKIE = "estudisc_theme"`
  - `type LabTheme = { theme: "vibrante"; palette: "a" | "b" | "c"; type: "archivo" | "rounded" }`
  - `parseThemeCookie(value: string | undefined): LabTheme | null`
  - `serializeThemeCookie(theme: LabTheme): string` → `"vibrante:a:archivo"`
  - `themeAttributes(theme: LabTheme | null): Record<string, string>` → `{ "data-theme": "vibrante", "data-palette": "a", "data-type": "archivo" }` or `{}`
  - CSS variable `--font-rounded` on `<html>`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/design-lab-theme-cookie.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the cookie helpers**

```ts
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
```

- [ ] **Step 4: Wire the layout** — in `src/app/layout.tsx`: load a rounded display face and apply attributes only for ADMIN when the cookie is present.

```tsx
import { Archivo, Fredoka, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { getOwnerProfile } from "@/features/auth/owner";
import { parseThemeCookie, THEME_COOKIE, themeAttributes } from "@/features/design-lab/theme-cookie";
// …existing fonts…
const rounded = Fredoka({ subsets: ["latin"], variable: "--font-rounded", display: "swap" });

async function adminLabTheme() {
  const theme = parseThemeCookie((await cookies()).get(THEME_COOKIE)?.value);
  if (!theme) return null;
  try {
    return (await getOwnerProfile()).role === "ADMIN" ? theme : null;
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = await adminLabTheme();
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${mono.variable} ${rounded.variable}`} {...themeAttributes(theme)}>
      <body>{children}</body>
    </html>
  );
}
```

The profile is only read when the cookie exists, so normal requests pay nothing extra.

- [ ] **Step 5: Scaffold the theme stylesheet** — create `src/styles/themes/vibrante.css`:

```css
/* Vibrante theme (ADMIN preview, docs/superpowers/specs/2026-10-17-vibrant-theme-lab-design.md).
   Every rule is scoped under [data-theme="vibrante"]; token values come from design-tokens.json. */
```

and add as the last import in `src/app/globals.css`, after `public-site.css`:

```css
@import "../styles/themes/vibrante.css";
```

- [ ] **Step 6: Run checks**

Run: `pnpm vitest run tests/unit/design-lab-theme-cookie.test.ts && pnpm typecheck && pnpm exec eslint src/app/layout.tsx src/features/design-lab`
Expected: PASS / no errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/design-lab/theme-cookie.ts tests/unit/design-lab-theme-cookie.test.ts src/app/layout.tsx src/app/globals.css src/styles/themes/vibrante.css
git commit -m "feat(design-lab): admin-only theme cookie and rounded display font"
```

---

### Task 4: Vibrante component treatments

**Files:**
- Modify: `src/styles/themes/vibrante.css`

**Interfaces:**
- Consumes: classes already used by the app: `.primary-action`, `.secondary-action`, `.elev-surface`, `.elev-action`, `.question-sheet`, `.answer-row`, `.answer-bubble`, `.type-display`, `.type-hero`, `.type-title`, `.type-meta`, `.topbar`, `.sidebar`, `.secondary-navigation`, `.lesson-article`, `.reading-column`, `.brand-word`; variables `--font-rounded`, `--estudisc-color-*`.
- Produces: visual treatment only; no markup change.

- [ ] **Step 1: Write the treatments**

```css
[data-theme="vibrante"] body { background: var(--estudisc-color-paper); font-weight: var(--estudisc-typography-body-weights-regular); }

/* Pills: actions and chips. */
[data-theme="vibrante"] .primary-action,
[data-theme="vibrante"] .secondary-action { border-radius: 999px; font-weight: 800; letter-spacing: 0.01em; }
[data-theme="vibrante"] .primary-action { background: var(--estudisc-color-signal); color: var(--estudisc-color-signal-ink); }
[data-theme="vibrante"] .secondary-action { background: var(--estudisc-color-panel); }

/* Surfaces: white sheets with a black outline on a colored frame. */
[data-theme="vibrante"] .elev-surface,
[data-theme="vibrante"] .question-sheet { background: var(--estudisc-color-panel); border-radius: var(--estudisc-radius-learning-card); }
[data-theme="vibrante"] .answer-row { border-radius: var(--estudisc-radius-interactive); }
[data-theme="vibrante"] .answer-bubble { font-weight: 800; }

/* Reading stays calm: a white sheet, larger and heavier body text. */
[data-theme="vibrante"] .lesson-article,
[data-theme="vibrante"] .reading-column { background: var(--estudisc-color-panel); border: 3px solid var(--estudisc-color-ink); border-radius: var(--estudisc-radius-sheet); padding: var(--estudisc-spacing-16); }
[data-theme="vibrante"] .lesson-article p,
[data-theme="vibrante"] .reading-column p { font-size: 1.0625rem; line-height: 1.6; }

/* Heavier type; meta captions move from monospace to the body face in caps. */
[data-theme="vibrante"] :is(h1, h2, h3, .type-display, .type-hero, .type-title) { font-weight: var(--estudisc-typography-display-weight); }
[data-theme="vibrante"] .type-meta { font-family: var(--font-archivo), sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
[data-theme="vibrante"][data-type="rounded"] :is(h1, h2, h3, .type-display, .type-hero, .type-title, .brand-word) { font-family: var(--font-rounded), var(--font-archivo), sans-serif; font-weight: 700; letter-spacing: -0.01em; }

/* Dark bottom bar on phones. */
@media (max-width: 767px) {
  [data-theme="vibrante"] .secondary-navigation { background: var(--estudisc-color-ink); color: var(--estudisc-color-panel); border-radius: 999px; margin: var(--estudisc-spacing-8); }
  [data-theme="vibrante"] .secondary-navigation a { color: var(--estudisc-color-panel); }
}
```

Before writing, confirm `--estudisc-spacing-8` and `--estudisc-spacing-16` exist in `src/styles/generated/design-tokens.css` (`grep -c "estudisc-spacing-16:"`); if a step is missing use the nearest existing spacing token. If `.secondary-navigation` is not the mobile bottom bar, find the bottom bar's class in `src/components/layout/primary-nav.tsx` and use that instead.

- [ ] **Step 2: Build check**

Run: `pnpm build`
Expected: success (CSS parses; no runtime change for the default theme).

- [ ] **Step 3: Commit**

```bash
git add src/styles/themes/vibrante.css
git commit -m "feat(design-lab): vibrante pills, sheets, heavier type and dark bottom bar"
```

---

### Task 5: `/admin/lab` page with controls

**Files:**
- Create: `src/app/admin/lab/page.tsx`
- Create: `src/app/admin/lab/actions.ts`
- Create: `src/features/design-lab/lab-gallery.tsx`
- Create: `src/styles/themes/design-lab.css` (lab layout only; import it in `globals.css` right before `vibrante.css`)
- Test: `tests/component/design-lab-gallery.test.tsx`

**Interfaces:**
- Consumes: `contrastReport`, `parseThemeCookie`, `serializeThemeCookie`, `THEME_COOKIE`, `LabTheme`; `requireAdmin`, `AccessDeniedError` from `@/features/auth/owner`; `loadSampleQuestion`, `SampleQuestion`; `BrandLockup`.
- Produces: `LabGallery({ sample }: { sample: SampleQuestionData | null })` — renders the gallery once; the page renders it in two columns: `<div data-theme-preview="current">` and `<div data-theme="vibrante" data-palette={p} data-type={t}>`.
- Server action `setLabTheme(formData: FormData): Promise<void>` — fields `palette`, `type`, `apply` (`"on"` | `"off"`).

- [ ] **Step 1: Write the failing component test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LabGallery } from "@/features/design-lab/lab-gallery";

describe("LabGallery", () => {
  it("shows every section with the four subjects", () => {
    render(<LabGallery sample={null} />);
    for (const heading of ["Botões e filtros", "Matérias", "Questão", "Leitura", "Estado vazio"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    for (const subject of ["Matemática", "Ciências", "Português", "Geografia e História"]) {
      expect(screen.getByText(subject)).toBeInTheDocument();
    }
  });
});
```

Check an existing file in `tests/component/` for the exact render/setup imports this repo uses (e.g. whether `@testing-library/jest-dom` matchers are globally set up) and match it.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/component/design-lab-gallery.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the gallery**

```tsx
import { BrandLockup } from "@/components/brand/brand-lockup";
import { SampleQuestion, type SampleQuestionData } from "@/features/public-site/sample-question";

const SUBJECTS = [
  { key: "mathematics", name: "Matemática", lesson: "Porcentagem" },
  { key: "science", name: "Ciências", lesson: "Movimento" },
  { key: "portuguese", name: "Português", lesson: "Inferência e leitura de contexto" },
  { key: "historyGeography", name: "Geografia e História", lesson: "Fusos horários" }
] as const;

const KEBAB: Record<string, string> = { mathematics: "mathematics", science: "science", portuguese: "portuguese", historyGeography: "history-geography" };

export function LabGallery({ sample }: Readonly<{ sample: SampleQuestionData | null }>) {
  return (
    <div className="lab-gallery">
      <BrandLockup />
      <section><h2 className="type-title">Botões e filtros</h2>
        <div className="lab-row">
          <button type="button" className="primary-action elev-action">Continuar estudando</button>
          <button type="button" className="secondary-action">Ver plano</button>
          <span className="lab-chip">Hoje</span><span className="lab-chip">Semana</span>
        </div>
        <label className="lab-field">Seu nome<input type="text" placeholder="Digite aqui" /></label>
      </section>
      <section><h2 className="type-title">Matérias</h2>
        <div className="lab-subjects">
          {SUBJECTS.map((s) => (
            <article key={s.key} className="lab-subject elev-surface" style={{ background: `var(--estudisc-color-subject-accent-${KEBAB[s.key]})` }}>
              <p className="type-meta">{s.name}</p><h3>{s.lesson}</h3><p>Aula 3 de 12 · 8 min</p>
            </article>
          ))}
        </div>
      </section>
      <section><h2 className="type-title">Questão</h2>{sample ? <SampleQuestion question={sample} /> : <p>Sem questão de amostra.</p>}</section>
      <section><h2 className="type-title">Leitura</h2>
        <div className="reading-column"><p>Porcentagem é uma razão com denominador 100. Dizer que 29% dos bilhetes pedem revisão significa que, a cada 100 bilhetes, 29 pedem.</p><p>Para achar 18% de 300, calcule 0,18 × 300 = 54.</p></div>
      </section>
      <section><h2 className="type-title">Estado vazio</h2>
        <div className="lab-empty elev-surface"><div className="lab-illustration" aria-hidden="true" /><p>Nada para revisar hoje. Volte amanhã!</p></div>
      </section>
    </div>
  );
}
```

Before writing, confirm the subject-accent variable names in `src/styles/generated/design-tokens.css` (`grep subject-accent`) and fix `KEBAB` to match.

- [ ] **Step 4: Lab layout CSS** — `src/styles/themes/design-lab.css`:

```css
.lab-columns { display: grid; gap: var(--estudisc-spacing-8); grid-template-columns: 1fr; padding: var(--estudisc-spacing-8); }
@media (min-width: 1100px) { .lab-columns { grid-template-columns: 1fr 1fr; } }
.lab-columns > div { background: var(--estudisc-color-paper); border: 2px solid var(--estudisc-color-ink); border-radius: 16px; padding: var(--estudisc-spacing-8); min-width: 0; }
.lab-gallery { display: grid; gap: var(--estudisc-spacing-12); }
.lab-row { display: flex; flex-wrap: wrap; gap: var(--estudisc-spacing-4); align-items: center; }
.lab-chip { border: 2px solid var(--estudisc-color-ink); border-radius: 999px; padding: 6px 14px; font-weight: 700; background: var(--estudisc-color-panel); }
.lab-field { display: grid; gap: 4px; font-weight: 700; }
.lab-field input { border: 2px solid var(--estudisc-color-ink); border-radius: var(--estudisc-radius-interactive); padding: 10px 12px; background: var(--estudisc-color-panel); }
.lab-subjects { display: grid; gap: var(--estudisc-spacing-4); grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.lab-subject { padding: var(--estudisc-spacing-6); border: 2px solid var(--estudisc-color-ink); border-radius: var(--estudisc-radius-learning-card); color: var(--estudisc-color-ink); }
.lab-empty { display: grid; justify-items: center; gap: var(--estudisc-spacing-4); padding: var(--estudisc-spacing-8); text-align: center; }
.lab-illustration { width: 120px; height: 120px; border: 3px dashed var(--estudisc-color-ink); border-radius: 50%; }
.lab-controls { display: flex; flex-wrap: wrap; gap: var(--estudisc-spacing-6); align-items: end; padding: var(--estudisc-spacing-8); }
.lab-report td, .lab-report th { padding: 4px 8px; text-align: left; }
```

Use only spacing tokens that exist (`grep -o "estudisc-spacing-[0-9]*:" src/styles/generated/design-tokens.css | sort -u`); replace any missing one with the nearest.

- [ ] **Step 5: Server action** — `src/app/admin/lab/actions.ts`:

```ts
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/owner";
import { parseThemeCookie, serializeThemeCookie, THEME_COOKIE } from "@/features/design-lab/theme-cookie";

export async function setLabTheme(formData: FormData) {
  await requireAdmin();
  const store = await cookies();
  const theme = parseThemeCookie(`vibrante:${formData.get("palette")}:${formData.get("type")}`);
  if (formData.get("apply") === "on" && theme) {
    store.set(THEME_COOKIE, serializeThemeCookie(theme), { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30 });
  } else {
    store.delete(THEME_COOKIE);
  }
  revalidatePath("/", "layout");
}
```

Check `node_modules/next/dist/docs/` for the current `cookies()` / server action / `revalidatePath` API in this Next version before writing; adapt if signatures differ.

- [ ] **Step 6: Page** — `src/app/admin/lab/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { AccessDeniedError, requireAdmin } from "@/features/auth/owner";
import { contrastReport } from "@/features/design-lab/contrast";
import { LabGallery } from "@/features/design-lab/lab-gallery";
import { parseThemeCookie, THEME_COOKIE } from "@/features/design-lab/theme-cookie";
import { loadSampleQuestion } from "@/features/public-site/sample-question-loader";
import { setLabTheme } from "./actions";

export const dynamic = "force-dynamic";

type Search = Promise<{ palette?: string; type?: string }>;

export default async function DesignLabPage({ searchParams }: Readonly<{ searchParams: Search }>) {
  try { await requireAdmin(); } catch (error) { if (error instanceof AccessDeniedError) notFound(); throw error; }
  const params = await searchParams;
  const saved = parseThemeCookie((await cookies()).get(THEME_COOKIE)?.value);
  const palette = (["a", "b", "c"].includes(params.palette ?? "") ? params.palette : saved?.palette ?? "a") as "a" | "b" | "c";
  const type = (params.type === "rounded" || params.type === "archivo" ? params.type : saved?.type ?? "archivo") as "archivo" | "rounded";
  const sample = await loadSampleQuestion();
  const report = contrastReport(palette);

  return (
    <main>
      <form className="lab-controls" method="get">
        <h1 className="type-title">Lab de design</h1>
        <label>Paleta <select name="palette" defaultValue={palette}><option value="a">Limão</option><option value="b">Lavanda</option><option value="c">Pêssego</option></select></label>
        <label>Fonte dos títulos <select name="type" defaultValue={type}><option value="archivo">Archivo pesado</option><option value="rounded">Arredondada</option></select></label>
        <button type="submit" className="secondary-action">Comparar</button>
      </form>
      <form className="lab-controls" action={setLabTheme}>
        <input type="hidden" name="palette" value={palette} /><input type="hidden" name="type" value={type} />
        <button type="submit" name="apply" value="on" className="primary-action">Ver o app inteiro neste tema</button>
        <button type="submit" name="apply" value="off" className="secondary-action">Voltar ao tema atual</button>
        <p>{saved ? `App inteiro: Vibrante (${saved.palette}, ${saved.type})` : "App inteiro: tema atual"}</p>
      </form>
      <div className="lab-columns">
        <div data-theme-preview="current"><h2 className="type-meta">Atual</h2><LabGallery sample={sample} /></div>
        <div data-theme="vibrante" data-palette={palette} data-type={type}><h2 className="type-meta">Vibrante</h2><LabGallery sample={sample} /></div>
      </div>
      <section className="lab-controls"><h2 className="type-title">Contraste (WCAG AA)</h2>
        <table className="lab-report"><thead><tr><th>Par</th><th>Razão</th><th>Resultado</th></tr></thead>
          <tbody>{report.map((pair) => <tr key={pair.label}><td>{pair.label}</td><td>{pair.ratio.toFixed(2)}:1</td><td>{pair.passes ? "Passa" : "Falha"}</td></tr>)}</tbody>
        </table>
      </section>
    </main>
  );
}
```

Note: `[data-theme="vibrante"] body` rules do not apply inside the preview div; the div itself gets `background: var(--estudisc-color-paper)` from `.lab-columns > div`, which resolves to the vibrant value inside the scoped container. `SampleQuestion` uses `useId`, so two instances on one page are fine.

- [ ] **Step 7: Run checks**

Run: `pnpm vitest run tests/component/design-lab-gallery.test.tsx && pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/admin/lab src/features/design-lab/lab-gallery.tsx src/styles/themes/design-lab.css src/app/globals.css tests/component/design-lab-gallery.test.tsx
git commit -m "feat(design-lab): /admin/lab with side-by-side themes, palette/type controls and contrast report"
```

---

### Task 6: E2E, visual check, docs

**Files:**
- Create: `tests/e2e/design-lab.spec.ts`
- Modify: `CHANGELOG.md`, `PROJECT_STATUS.md`, `design-system/DESIGN_SYSTEM_INDEX.md` (one line pointing at the spec)

- [ ] **Step 1: E2E test** — read `tests/e2e/` for how existing specs sign in as ADMIN under `DATABASE_URL=memory://local` (copy that helper/pattern exactly), then:

```ts
import { expect, test } from "@playwright/test";

test("admin previews the vibrante theme and turns it off", async ({ page }) => {
  // sign in as ADMIN using the same helper the other admin specs use
  await page.goto("/admin/lab?palette=b&type=rounded");
  await expect(page.getByRole("heading", { name: "Lab de design" })).toBeVisible();
  await expect(page.locator('[data-theme="vibrante"][data-palette="b"]')).toBeVisible();
  await page.getByRole("button", { name: "Ver o app inteiro neste tema" }).click();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "vibrante");
  await page.goto("/admin/lab");
  await page.getByRole("button", { name: "Voltar ao tema atual" }).click();
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "vibrante");
});
```

- [ ] **Step 2: Run it**

Run: `node scripts/run-e2e.mjs design-lab` (if port 3210 is busy, use a temporary config override and do not commit it)
Expected: PASS on both projects.

- [ ] **Step 3: Visual check** — start the app locally, sign in as ADMIN, open `/admin/lab` at 390 px and 1440 px widths for each palette and both type pairings; take screenshots; confirm no text overflow, every contrast row says "Passa", and the default theme column looks exactly like production.

- [ ] **Step 4: Docs** — add to the top of `CHANGELOG.md`:

```md
## 2026-10-17 — Design lab and vibrante theme (ADMIN preview)

- `/admin/lab` compares the current look with a vibrant neo-brutalist theme (three palettes, two title faces), with a WCAG contrast report; "Ver o app inteiro neste tema" previews real screens through an ADMIN-only cookie. Students never see it. Spec: docs/superpowers/specs/2026-10-17-vibrant-theme-lab-design.md.
```

Add one line at the top of `PROJECT_STATUS.md` with the NEXT ACTION: "owner picks palette/type in /admin/lab; then ADR 0069 makes vibrante the default and the per-screen review resumes." Add a pointer line in `design-system/DESIGN_SYSTEM_INDEX.md`.

- [ ] **Step 5: Full checks**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all PASS.

- [ ] **Step 6: Commit; ask the owner before pushing**

```bash
git add tests/e2e/design-lab.spec.ts CHANGELOG.md PROJECT_STATUS.md design-system/DESIGN_SYSTEM_INDEX.md
git commit -m "test(design-lab): e2e theme toggle; docs"
```
