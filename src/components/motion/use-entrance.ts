"use client";

import { type RefObject, useLayoutEffect, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Entrance motion that never flashes server-rendered content.
 *
 * The CSP blocks server-rendered `style` attributes, so hidden start states cannot ship in HTML. A
 * hydrated element has usually been painted already; hiding it to animate in would flash final → empty
 * → final. Elements therefore animate only when nobody has seen them yet: a client-side navigation
 * mount, or a hydrated element still below the fold. Reduced motion always keeps the static content.
 */
export function useEntrance<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { hide, play }: Readonly<{ hide: (element: T) => void; play: (element: T) => (() => void) | void }>
) {
  const hydrating = useSyncExternalStore(subscribe, () => false, () => true);
  const [mountedByHydration] = useState(hydrating);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (mountedByHydration && element.getBoundingClientRect().top < window.innerHeight) return;

    hide(element);
    let stop: (() => void) | void;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      stop = play(element);
    }, { threshold: 0.15 });
    observer.observe(element);

    return () => {
      observer.disconnect();
      stop?.();
    };
    // Entrance runs once per mount; callers remount (via key) when their content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Exponential ease-out for value (not position) changes such as CountUp. */
export const easeOutExpo = (progress: number) => (progress >= 1 ? 1 : 1 - 2 ** (-10 * progress));

function token(name: string, fallback: number) {
  const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Design System entrance (MOTION.md): opacity plus a short translate read from the canonical tokens
 * (slow ≤180 ms, travel 2–4 px), never blur or scale. Uses the Web Animations API, so no motion library
 * ships for entrances. Inline styles are cleared afterwards so CSS hover/press transforms keep working.
 */
export function playEntrance(elements: readonly HTMLElement[], { stagger = 0.03, delay = 0 }: Readonly<{ stagger?: number; delay?: number }> = {}) {
  if (typeof elements[0]?.animate !== "function") {
    elements.forEach((element) => { element.style.removeProperty("opacity"); element.style.removeProperty("transform"); });
    return () => {};
  }
  const duration = token("--estudisc-motion-slow", 180);
  const travel = token("--estudisc-motion-travel-max", 4);
  const easing = getComputedStyle(document.documentElement).getPropertyValue("--estudisc-motion-easing").trim() || "ease-out";
  const animations = elements.map((element, index) => {
    const animation = element.animate(
      [{ opacity: 0, transform: `translateY(${travel}px)` }, { opacity: 1, transform: "translateY(0)" }],
      { duration, delay: (delay + Math.min(index, 8) * stagger) * 1000, easing, fill: "backwards" }
    );
    // Clear the hidden start state once the animation owns the frames.
    element.style.removeProperty("opacity");
    element.style.removeProperty("transform");
    return animation;
  });
  return () => animations.forEach((animation) => animation.cancel());
}
