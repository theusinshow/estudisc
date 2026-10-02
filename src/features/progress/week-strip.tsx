"use client";

import { Check } from "lucide-react";
import { animate, stagger } from "motion/react";
import { useRef } from "react";

import { useEntrance } from "@/components/motion/use-entrance";
import type { ActivityDay } from "./overview";

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const fullDay = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function dayState(day: ActivityDay) {
  if (day.isFuture) return "ainda por vir";
  if (day.count > 0) return day.isToday ? "hoje, com estudo" : "com estudo";
  return day.isToday ? "hoje, ainda sem estudo" : "sem estudo";
}

/** Current week, Sunday first. Studied days are marked; missed days stay neutral — nothing to lose. */
export function WeekStrip({ days }: Readonly<{ days: readonly ActivityDay[] }>) {
  const ref = useRef<HTMLOListElement>(null);

  useEntrance(ref, {
    hide: (element) => {
      for (const child of element.children) (child as HTMLElement).style.opacity = "0";
    },
    play: (element) => {
      const cells = [...element.children] as HTMLElement[];
      const controls = animate(cells, { opacity: [0, 1], transform: ["scale(0.6)", "scale(1)"] }, { type: "spring", visualDuration: 0.32, bounce: 0.35, delay: stagger(0.05) });
      void controls.then(() => cells.forEach((cell) => cell.removeAttribute("style")));
      return () => controls.stop();
    }
  });

  return (
    <ol className="week-strip" ref={ref} aria-label="Sua semana">
      {days.map((day) => {
        const date = new Date(`${day.date}T00:00:00Z`);
        return (
          <li key={day.date} data-studied={day.count > 0 || undefined} data-today={day.isToday || undefined} data-future={day.isFuture || undefined}>
            <span className="week-day" aria-hidden="true">{weekday.format(date).replace(".", "")}</span>
            <span className="week-mark" aria-hidden="true">{day.count > 0 ? <Check /> : null}</span>
            <span className="sr-only">{`${fullDay.format(date)}: ${dayState(day)}`}</span>
          </li>
        );
      })}
    </ol>
  );
}
