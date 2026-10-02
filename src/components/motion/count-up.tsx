"use client";

/**
 * Adapted from React Bits CountUp (https://reactbits.dev/text-animations/count-up): the final value is
 * server-rendered and read by assistive technology; only the visible digits count up, and only when
 * `useEntrance` allows it.
 */
import { animate } from "motion/react";
import { useRef } from "react";

import "./motion.css";

import { entranceEase, useEntrance } from "./use-entrance";

type CountUpProps = Readonly<{ value: number; delay?: number; duration?: number; className?: string }>;

const formatter = new Intl.NumberFormat("pt-BR");

export function CountUp(props: CountUpProps) {
  // A new value remounts, so the imperatively written digits never fight React's text node.
  return <CountUpDigits key={props.value} {...props} />;
}

function CountUpDigits({ value, delay = 0, duration = 1.1, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEntrance(ref, {
    hide: (element) => {
      element.textContent = formatter.format(0);
    },
    play: (element) => {
      const controls = animate(0, value, {
        duration,
        delay,
        ease: entranceEase,
        onUpdate: (latest) => {
          element.textContent = formatter.format(Math.round(latest));
        }
      });
      return () => controls.stop();
    }
  });

  return (
    <span className={["count-up", className].filter(Boolean).join(" ")}>
      <span ref={ref} aria-hidden="true">{formatter.format(value)}</span>
      <span className="sr-only">{formatter.format(value)}</span>
    </span>
  );
}
