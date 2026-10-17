# Vibrant theme lab — design

Date: 2026-10-17. Owner decision in chat. Will be recorded as ADR 0069 when the lab ships; it supersedes the visual layer of ADR 0067 ("caderno de prova") only after the owner approves the theme.

## Problem

The current look reads as washed out: cream paper (`#FFF4E0`) with beige panels (`#F6E9CF`, `#F1E4C8`) gives low contrast, body text is light and small, monospace captions feel like a terminal, and hard-shadow cards weigh the screen without adding meaning. The owner wants something livelier and more youthful for 14-year-old students, with strong type and everything still easy to read.

References (owner): vibrant neo-brutalism — saturated flat colors (lime, purple, coral, vivid yellow, leaf green; also peach/pink/lavender), black outlines with hard offset shadows, large radii, pill buttons and chips, heavy display type, filled bold icons, dark bottom bar on mobile.

## Decisions taken

1. **Lab inside the app** at `/lab` (ADMIN only), using the real components and content.
2. **Direction:** "Vibrante e jovem".
3. **Vibrant frame, neutral reading:** navigation screens (Today, Tracks, Progress, landing, sign-in) use colored backgrounds and cards; inside a lesson or question, text sits on a light "sheet" with a black outline, and color is limited to buttons, choices, highlights and the subject tag.
4. **One color per subject**, used on cards, tracks, tags and the lesson header. Starting proposal: Matemática coral, Ciências green, Português purple, Geografia e História yellow. The tokens already have `color.subjectAccent`; the theme redefines it.
5. **No mascot in this round.** Layouts leave room for an illustration slot.
6. **Approach A: theme by tokens.** No screen rewrites.

## Architecture

- **Theme layer.** `design-system/design-tokens.json` gains a `themes.vibrante` override set (colors, radius, shadow, typography weights, subject colors). `scripts/generate-design-tokens.mjs` emits it as `:root[data-theme="vibrante"] { … }` overriding the same `--estudisc-*` variables. Component adjustments that tokens alone cannot express (pill shapes, bottom bar, sheet treatment) live in one file, `src/styles/themes/vibrante.css`, every rule scoped under `[data-theme="vibrante"]`. The current theme stays the default and is untouched.
- **Theme selection.** `src/app/layout.tsx` sets `data-theme` on `<html>` from a cookie `estudisc_theme` (`vibrante` or absent). The cookie is honored only for ADMIN profiles; for everyone else the attribute is never set. A small server action in the lab toggles it.
- **Variants.** Inside the lab, sub-variants are extra attributes on the preview container only: `data-palette="a|b|c"` (three palettes in the same style, e.g. lime frame / lavender frame / peach frame) and `data-type="archivo|rounded"` (type pairing). The "whole app" toggle applies the palette and type the owner picked last (stored in the same cookie as `vibrante:a:archivo`).
- **Fonts.** Archivo stays (variable, weights up to 900, width axis); body moves to 500/600 in the vibrant theme. A second, rounder display face is loaded through `next/font/google` (self-hosted, CSP unchanged), only applied under `data-type="rounded"`. Candidate: a rounded heavy grotesk available on Google Fonts; final pick happens in the lab.
- **`/lab` page** (`src/app/lab/page.tsx`, ADMIN only via the existing admin path guard): side-by-side "Atual" vs "Vibrante" columns (stacked on mobile) showing real components: primary/secondary buttons, chips/filters, the question sheet with choices (idle, selected, right, wrong), subject cards for the four subjects, a Today summary block, a lesson reading excerpt with a math formula, the bottom navigation, form inputs, empty state with illustration slot. Controls: palette, type pairing, "ver o app inteiro neste tema" (sets the cookie), contrast report.
- **Contrast report.** A pure function computes WCAG contrast for every text/background token pair of the selected variant and lists any pair under 4.5:1 (3:1 for large text and UI borders). Shown in the lab and asserted in a unit test.

## Out of scope

Mascot and illustrations; content, copy or behavior changes; dark mode; removing the current theme; any student-visible change. The `/conheca` and sign-in issues found in the screen review are fixed separately, after the theme is chosen.

## Error handling and safety

- Unknown cookie values are ignored (default theme).
- The cookie is read only when the profile is ADMIN; students never get `data-theme`.
- Reduced motion keeps disabling theme animations.

## Testing

- Unit: token generator emits the `vibrante` block; theme cookie parser (valid/invalid/non-admin); contrast checker, plus a test that every vibrant text pair passes AA.
- Component: `/lab` renders all sections for ADMIN; non-admin gets the existing admin-required behavior.
- E2E: one flow toggles the theme in the lab and sees `data-theme="vibrante"` on Today; default suite unchanged.
- Manual: owner reviews `/lab` and real screens on phone and desktop.

## Rollout

1. Build the lab and theme layer; push to `main` (owner approves the push).
2. Owner iterates palette/type in the lab; adjustments are token edits.
3. On approval: ADR 0069, make `vibrante` the default for everyone, retire the old values from the default set, then fix the per-screen issues from the review.
