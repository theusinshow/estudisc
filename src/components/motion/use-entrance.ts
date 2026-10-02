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

/** Exponential ease-out shared by the entrance micro-interactions. */
export const entranceEase = [0.16, 1, 0.3, 1] as const;
