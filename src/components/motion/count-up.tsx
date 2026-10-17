"use client";

/**
 * Adapted from React Bits CountUp (https://reactbits.dev/text-animations/count-up): the final value is
 * server-rendered and read by assistive technology; only the visible digits count up, and only when
 * `useEntrance` allows it. A requestAnimationFrame loop replaces the motion library for this number.
 */
import { useRef } from "react";

import "./motion.css";

import { easeOutExpo, useEntrance } from "./use-entrance";

type CountUpProps = Readonly<{ value: number; delay?: number; duration?: number; className?: string }>;

const formatter = new Intl.NumberFormat("pt-BR");

export function CountUp(props: CountUpProps) {
  // A new value remounts, so the imperatively written digits never fight React's text node.
  return <CountUpDigits key={props.value} {...props} />;
}

function CountUpDigits({ value, delay = 0, duration = 0.6, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEntrance(ref, {
    hide: (element) => {
      element.textContent = formatter.format(0);
    },
    play: (element) => {
      let frame = 0;
      const start = performance.now() + delay * 1000;
      const tick = (now: number) => {
        const progress = Math.max(0, now - start) / (duration * 1000);
        element.textContent = formatter.format(Math.round(value * easeOutExpo(progress)));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(frame);
        element.textContent = formatter.format(value);
      };
    }
  });

  return (
    <span className={["count-up", className].filter(Boolean).join(" ")}>
      <span ref={ref} aria-hidden="true">{formatter.format(value)}</span>
      <span className="visually-hidden">{formatter.format(value)}</span>
    </span>
  );
}
