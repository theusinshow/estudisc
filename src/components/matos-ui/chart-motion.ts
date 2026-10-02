/**
 * Matos UI chart motion, reduced to the values the vendored charts use.
 * Upstream reads these from `@/lib/motion-tokens`; KNOW/OS has no such module, so the tiers are inlined.
 */
const decelerate = [0.05, 0.7, 0.1, 1] as const;

/** Point / cell accent under hover, focus or selection. */
export const chartAccentTransition = { type: "spring", visualDuration: 0.24, bounce: 0.16 } as const;

/** Tooltip enter/exit. */
export const chartTooltipTransition = chartAccentTransition;

/** Per-mark delay when a series staggers itself in. */
export const chartStaggerStep = 0.04;

/** Tighter step for a dense grid such as a heatmap filling in. */
export const chartCascadeStep = 0.012;

/** Draw-on tween; callers pass the data-scaled length in seconds. */
export function chartDraw(seconds = 0.52) {
  return { duration: seconds, ease: decelerate } as const;
}
