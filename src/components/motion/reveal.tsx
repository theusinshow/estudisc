"use client";

/**
 * Staggered entry adapted from the React Bits AnimatedList item (https://reactbits.dev/components/animated-list),
 * without its scroll container: the element keeps its own semantics and layout, and inline styles are
 * cleared after the entrance so CSS hover/press transforms keep working.
 */
import { animate } from "motion/react";
import { type ReactNode, type RefObject, useRef } from "react";

import { entranceEase, useEntrance } from "./use-entrance";

type RevealProps = Readonly<{
  as?: "div" | "li" | "section";
  index?: number;
  className?: string;
  children: ReactNode;
}> & Readonly<Record<`aria-${string}` | `data-${string}`, string | undefined>>;

export function Reveal({ as = "div", index = 0, className, children, ...attributes }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEntrance(ref, {
    hide: (element) => {
      element.style.opacity = "0";
      element.style.transform = "translateY(14px)";
      element.style.filter = "blur(4px)";
    },
    play: (element) => {
      const controls = animate(
        element,
        { opacity: [0, 1], transform: ["translateY(14px)", "translateY(0px)"], filter: ["blur(4px)", "blur(0px)"] },
        { duration: 0.5, delay: Math.min(index, 8) * 0.06, ease: entranceEase }
      );
      void controls.then(() => {
        element.style.removeProperty("opacity");
        element.style.removeProperty("transform");
        element.style.removeProperty("filter");
      });
      return () => controls.stop();
    }
  });

  const Tag = as;
  return <Tag ref={ref as RefObject<HTMLDivElement & HTMLLIElement>} className={className} {...attributes}>{children}</Tag>;
}
