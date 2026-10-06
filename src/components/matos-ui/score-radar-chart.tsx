"use client";

/**
 * Matos UI Score Radar (https://matos-ui.com/charts/score-radar-chart), vendored and adapted:
 * motion/react instead of framer-motion, Estudisc tokens through CSS classes (CSP blocks SSR style
 * attributes), client-only gating that cannot mismatch hydration, roving focus and wrapped labels.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useMemo } from "react";

import { useChartInteraction } from "./chart-interaction";
import { chartAccentTransition, chartDraw, chartStaggerStep, chartTooltipTransition } from "./chart-motion";

export type ScoreRadarDatum = Readonly<{ label: string; value: number; detail: string }>;

type ScoreRadarChartProps = Readonly<{
  data: readonly ScoreRadarDatum[];
  title: string;
  maxValue: number;
  rings?: number;
  className?: string;
}>;

const WIDTH = 460;
const HEIGHT = 360;
const CX = 230;
const CY = 180;
const MAX_R = 104;
const LABEL_R = MAX_R + 20;

function point(radius: number, angle: number) {
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
}

function angleAt(index: number, count: number) {
  return -Math.PI / 2 + (2 * Math.PI * index) / count;
}

function polygon(radii: readonly number[]) {
  return `${radii.map((radius, index) => {
    const { x, y } = point(radius, angleAt(index, radii.length));
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ")} Z`;
}

/** Splits a long axis label into at most two lines near its middle space. */
function wrapLabel(label: string): string[] {
  if (label.length <= 14 || !label.includes(" ")) return [label];
  const middle = label.length / 2;
  const split = [...label.matchAll(/ /g)].map((match) => match.index ?? 0).sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle))[0];
  return [label.slice(0, split), label.slice(split + 1)];
}

export function ScoreRadarChart({ data, title, maxValue, rings = 5, className }: ScoreRadarChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const motionEnabled = !shouldReduceMotion;
  const count = data.length;
  const { activeIndex, getItemProps, hasEnteredView, interactionProps, selectedIndex } = useChartInteraction(id, count);
  const rovingIndex = activeIndex ?? selectedIndex ?? 0;

  const vertices = useMemo(() => data.map((datum, index) => {
    const angle = angleAt(index, count);
    const radius = (Math.min(Math.max(datum.value, 0), maxValue) / maxValue) * MAX_R;
    const vertex = point(radius, angle);
    const label = point(LABEL_R, angle);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      ...datum,
      index,
      vx: vertex.x,
      vy: vertex.y,
      axis: point(MAX_R, angle),
      lx: label.x,
      ly: label.y,
      anchor: (Math.abs(cos) < 0.18 ? "middle" : cos > 0 ? "start" : "end") as "middle" | "start" | "end",
      dy: sin < -0.12 ? -14 : sin > 0.12 ? 10 : -2,
      lines: wrapLabel(datum.label)
    };
  }), [count, data, maxValue]);

  const valuePath = polygon(vertices.map((vertex) => Math.hypot(vertex.vx - CX, vertex.vy - CY)));
  const active = activeIndex === null ? null : vertices[activeIndex];
  const tooltipWidth = 176;
  const tooltipHeight = 52;
  const tooltipX = active ? Math.min(Math.max(active.vx - tooltipWidth / 2, 4), WIDTH - tooltipWidth - 4) : 0;
  const tooltipY = active ? Math.min(Math.max(active.vy - tooltipHeight - 16, 4), HEIGHT - tooltipHeight - 4) : 0;

  return (
    <div className={["matos-radar", className].filter(Boolean).join(" ")} {...interactionProps}>
      <div className="matos-radar-plot">
        {hasEnteredView ? (
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label={title}>
            {Array.from({ length: rings }, (_, ring) => ((ring + 1) / rings) * MAX_R).map((radius) => (
              <path key={radius} d={polygon(Array(count).fill(radius))} className={radius === MAX_R ? "matos-radar-ring is-outer" : "matos-radar-ring"} />
            ))}
            {vertices.map((vertex) => (
              <line key={`spoke-${vertex.index}`} x1={CX} y1={CY} x2={vertex.axis.x} y2={vertex.axis.y} className="matos-radar-spoke" />
            ))}
            <motion.path
              d={valuePath}
              className="matos-radar-area"
              initial={motionEnabled ? { scale: 0, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={chartDraw(0.7)}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />
            <motion.path
              d={valuePath}
              className="matos-radar-line"
              initial={motionEnabled ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ ...chartDraw(1), delay: 0.08 }}
            />
            {vertices.map((vertex) => (
              <text key={`label-${vertex.index}`} x={vertex.lx} y={vertex.ly + vertex.dy} textAnchor={vertex.anchor} className="matos-radar-label">
                {vertex.lines.map((line, index) => (
                  <tspan key={line} x={vertex.lx} dy={index === 0 ? 0 : 18}>{line}</tspan>
                ))}
              </text>
            ))}
            {vertices.map((vertex) => {
              const isActive = activeIndex === vertex.index;
              return (
                <motion.g
                  key={`vertex-${vertex.index}`}
                  role="button"
                  tabIndex={vertex.index === rovingIndex ? 0 : -1}
                  aria-label={`${vertex.label}: ${vertex.detail}`}
                  className="matos-radar-vertex"
                  {...getItemProps(vertex.index)}
                  initial={motionEnabled ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ ...chartDraw(0.3), delay: 0.5 + vertex.index * chartStaggerStep }}
                >
                  {/* Generous invisible hit area for touch. */}
                  <circle cx={vertex.vx} cy={vertex.vy} r="18" className="matos-radar-hit" />
                  <motion.circle
                    cx={vertex.vx}
                    cy={vertex.vy}
                    className="matos-radar-dot"
                    data-active={isActive || undefined}
                    initial={false}
                    animate={{ r: isActive ? 7.5 : 5 }}
                    transition={chartAccentTransition}
                  />
                </motion.g>
              );
            })}
            <AnimatePresence>
              {active ? (
                <motion.g
                  key="tooltip"
                  pointerEvents="none"
                  initial={motionEnabled ? { opacity: 0, y: 4 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={chartTooltipTransition}
                >
                  <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx="8" className="matos-tooltip-box" />
                  <text x={tooltipX + 12} y={tooltipY + 21} className="matos-tooltip-value">{active.label}</text>
                  <text x={tooltipX + 12} y={tooltipY + 39} className="matos-tooltip-label">{active.detail}</text>
                </motion.g>
              ) : null}
            </AnimatePresence>
          </svg>
        ) : null}
      </div>
    </div>
  );
}
