# Styles

The canonical Design System version is `design-system/VERSION`; token values are in `design-system/design-tokens.json`.

`src/app/globals.css` only coordinates Tailwind, generated tokens and ordered application modules. Feature-specific CSS belongs beside the feature or in `src/styles/`; new features must not grow globals.css. Preserve the existing import order and cascade when extracting rules.

Generated files identify their source and must not be edited manually. Run `pnpm generate:tokens` after approved token changes.
