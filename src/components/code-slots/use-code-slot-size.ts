"use client";

import { useSyncExternalStore } from "react";

/**
 * Slot size per phone width so six slots fit the sign-in card down to 320 px. Each tier must match
 * its --cs-* values in account-sign-in.css: CodeSlots positions the caret from slotSize and gap.
 */
const TIERS = [
  { query: "(max-width: 360px)", slotSize: 36, gap: 6, className: "code-slots--tight" },
  { query: "(max-width: 420px)", slotSize: 40, gap: 6, className: "code-slots--compact" }
] as const;
const REGULAR = { slotSize: 48, gap: 8, className: "" } as const;

// Without matchMedia (old browsers, jsdom) the regular size is used.
const canMatch = () => typeof window.matchMedia === "function";

function subscribe(onChange: () => void) {
  if (!canMatch()) return () => {};
  const queries = TIERS.map(tier => window.matchMedia(tier.query));
  queries.forEach(query => query.addEventListener("change", onChange));
  return () => queries.forEach(query => query.removeEventListener("change", onChange));
}

const tierIndex = () => (canMatch() ? TIERS.findIndex(tier => window.matchMedia(tier.query).matches) : -1);

export function useCodeSlotSize() {
  const index = useSyncExternalStore(subscribe, tierIndex, () => -1);
  return index < 0 ? REGULAR : TIERS[index];
}
