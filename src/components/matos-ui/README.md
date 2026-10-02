# Matos UI charts

Chart components vendored from the [Matos UI](https://matos-ui.com/charts) shadcn registry (`https://matos-ui.com/r/<name>.json`) and adapted for KNOW/OS:

- `motion/react` replaces `framer-motion`; `tailwind-variants`, `tailwind-merge` and the Matos `motion-tokens`/`surface-*` modules are not installed — the few motion values live in `chart-motion.ts`.
- Colors come from KNOW/OS tokens through classes in `src/styles/progress.css`. The CSP blocks server-rendered `style` attributes, so the SVG renders only after the client-side in-view flag (`useChartInView`) flips; containers reserve their aspect ratio to avoid layout shift.
- Roving focus replaces one tab stop per mark; tooltips carry pt-BR copy.

Charts are supplementary: every page that uses one also states the same facts in text.
