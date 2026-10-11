# Styles

The canonical Design System version is `design-system/VERSION`; token values are in `design-system/design-tokens.json`.

`src/app/globals.css` only coordinates Tailwind, generated tokens and ordered application modules. Feature-specific CSS belongs beside the feature or in `src/styles/`; new features must not grow globals.css. Preserve the existing import order and cascade when extracting rules.

Generated files identify their source and must not be edited manually. Run `pnpm generate:tokens` after approved token changes.

`application/routine.css` follows shell foundation and scopes weekly routine forms/week rendering. It uses existing canonical token values and native touch/keyboard controls.

`application/shell.css` follows `application/interactions.css` and contains the progressive five-destination/Focus/dialog/tab foundation. It consumes existing token values; new Today presentation remains in `today.css`.

`application/interactions.css` was split by surface on 2026-10-11 (base controls/shell stay in `interactions.css`; then `today-base`, `lesson-reading`, `study-session`, `assessments`, `review-queue`, `lesson-stepper`, `code-slots`, `account-sign-in`). The concatenation of those modules in their `globals.css` order is byte-identical to the previous file, so the cascade is unchanged; add new rules to the module of their surface.

`application/math-notation.css` styles the presentation-only math notation contract (`src/components/ui/math-notation.ts`): exponents in the reading font, stacked integer fractions, overlined square roots and hanging worked-step lists. It only defines new classes and is imported last.
