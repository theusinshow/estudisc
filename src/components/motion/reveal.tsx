"use client";

/**
 * Staggered entry adapted from the React Bits AnimatedList item (https://reactbits.dev/components/animated-list),
 * without its scroll container: the element keeps its own semantics and layout. Timing and travel follow the
 * Design System motion tokens (opacity + 2–4 px, ≤180 ms, no blur).
 */
import { type ReactNode, type RefObject, useRef } from "react";

import { playEntrance, useEntrance } from "./use-entrance";

type RevealProps = Readonly<{
  as?: "div" | "li" | "section";
  index?: number;
  className?: string;
  children: ReactNode;
}> & Readonly<Record<`aria-${string}` | `data-${string}`, string | undefined>>;

const staggerSeconds = 0.03;

export function Reveal({ as = "div", index = 0, className, children, ...attributes }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEntrance(ref, {
    hide: (element) => {
      element.style.opacity = "0";
    },
    // A single element: its list position becomes the delay so siblings still enter in order.
    play: (element) => playEntrance([element], { stagger: 0, delay: Math.min(index, 8) * staggerSeconds })
  });

  const Tag = as;
  return <Tag ref={ref as RefObject<HTMLDivElement & HTMLLIElement>} className={className} {...attributes}>{children}</Tag>;
}
