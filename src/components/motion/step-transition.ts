"use client";

function token(name: string, fallback: number) {
  const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Question/step transition (ADR 0067): the step that just became visible slides in horizontally by
 * `motion.questionTravel` from the side of travel. Steps stay mounted (answers survive navigation), so only
 * the entrance animates. Web Animations API, transform/opacity only; reduced motion shows the final state.
 */
export function playStepTransition(element: HTMLElement | null | undefined, direction: 1 | -1) {
  if (!element || typeof element.animate !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const travel = token("--estudisc-motion-question-travel", 24) * direction;
  const duration = token("--estudisc-motion-ui-slow", 250);
  const easing = getComputedStyle(document.documentElement).getPropertyValue("--estudisc-motion-ease-out").trim() || "ease-out";
  element.animate([{ opacity: 0, transform: `translateX(${travel}px)` }, { opacity: 1, transform: "translateX(0)" }], { duration, easing });
}
