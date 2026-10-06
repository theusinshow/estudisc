"use client";

/**
 * Matos UI Activity Heatmap (https://matos-ui.com/charts/activity-heatmap-chart), vendored and adapted:
 * motion/react instead of framer-motion, Estudisc tokens through CSS classes (the CSP blocks SSR style
 * attributes), positioned month labels, roving focus with day/week arrow keys and pt-BR copy.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, useId } from "react";

import { useChartInteraction } from "./chart-interaction";
import { chartAccentTransition, chartCascadeStep, chartDraw, chartTooltipTransition } from "./chart-motion";

export type ActivityHeatmapDatum = Readonly<{ value: number; label: string; isToday?: boolean }>;
export type ActivityHeatmapMonth = Readonly<{ column: number; label: string }>;

type ActivityHeatmapChartProps = Readonly<{
  data: readonly ActivityHeatmapDatum[];
  title: string;
  months: readonly ActivityHeatmapMonth[];
  dayLabels?: readonly string[];
  weeks: number;
  valueFormatter: (value: number) => string;
  className?: string;
}>;

const DAYS = 7;
const CELL = 15;
const GAP = 4;
const PITCH = CELL + GAP;
const LEFT = 30;
const TOP = 18;

export function heatmapViewBox(weeks: number) {
  return { width: LEFT + weeks * PITCH - GAP + 4, height: TOP + DAYS * PITCH - GAP + 6 };
}

export function ActivityHeatmapChart({ data, title, months, dayLabels = ["", "Seg", "", "Qua", "", "Sex", ""], weeks, valueFormatter, className }: ActivityHeatmapChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const { activeIndex, getItemProps, hasEnteredView, interactionProps, selectedIndex } = useChartInteraction(id, data.length);
  const motionEnabled = !shouldReduceMotion;
  const max = Math.max(1, ...data.map((item) => item.value));
  const { width, height } = heatmapViewBox(weeks);
  const rovingIndex = activeIndex ?? selectedIndex ?? data.length - 1;

  const cells = data.map((item, index) => {
    const column = Math.floor(index / DAYS);
    const row = index % DAYS;
    const level = item.value <= 0 ? 0 : Math.min(Math.max(Math.ceil((item.value / max) * 4), 1), 4);
    return { ...item, index, column, row, x: LEFT + column * PITCH, y: TOP + row * PITCH, level };
  });
  const active = activeIndex === null ? null : cells[activeIndex];

  const tooltipWidth = 168;
  const tooltipHeight = 46;
  const tooltipX = active ? Math.min(Math.max(active.x + CELL / 2 - tooltipWidth / 2, 2), width - tooltipWidth - 2) : 0;
  // Below the cell for the top rows, so the tooltip never clips at the top edge.
  const tooltipY = active ? (active.row < 3 ? active.y + CELL + 6 : active.y - tooltipHeight - 6) : 0;

  function focusCell(index: number) {
    document.querySelector<SVGElement>(`[data-chart-interaction="${id}"] [data-chart-item-index="${index}"]`)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<SVGElement>, index: number) {
    const step = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -DAYS, ArrowRight: DAYS }[event.key];
    if (step === undefined) return getItemProps(index).onKeyDown(event);
    event.preventDefault();
    const next = index + step;
    if (next >= 0 && next < data.length) focusCell(next);
  }

  return (
    <div className={["matos-heatmap", className].filter(Boolean).join(" ")} {...interactionProps}>
      <div className="matos-heatmap-plot" data-weeks={weeks}>
        {/* Gated on the client-only in-view flag alone, so SSR and hydration always agree. */}
        {hasEnteredView ? (
          <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={title}>
            {months.map((month) => (
              <text key={`${month.label}-${month.column}`} x={LEFT + month.column * PITCH} y={TOP - 6} className="matos-axis-label">
                {month.label}
              </text>
            ))}
            {dayLabels.map((label, row) =>
              label ? (
                <text key={label} x={LEFT - 6} y={TOP + row * PITCH + CELL - 3} textAnchor="end" className="matos-axis-label">
                  {label}
                </text>
              ) : null
            )}
            {cells.map((cell) => {
              const isActive = activeIndex === cell.index;
              const delay = motionEnabled ? (cell.column + cell.row) * chartCascadeStep : 0;
              return (
                <motion.rect
                  key={cell.index}
                  x={cell.x}
                  y={cell.y}
                  width={CELL}
                  height={CELL}
                  rx="3.5"
                  className="matos-heat-cell"
                  data-level={cell.level}
                  data-today={cell.isToday || undefined}
                  data-active={isActive || undefined}
                  tabIndex={cell.index === rovingIndex ? 0 : -1}
                  role="button"
                  aria-label={`${cell.label}: ${valueFormatter(cell.value)}`}
                  {...getItemProps(cell.index)}
                  onKeyDown={(event) => handleKeyDown(event, cell.index)}
                  initial={motionEnabled ? { opacity: 0, scale: 0.3 } : false}
                  animate={{ opacity: 1, scale: isActive ? 1.16 : 1 }}
                  transition={{
                    opacity: { ...chartDraw(0.32), delay },
                    scale: isActive ? chartAccentTransition : { ...chartDraw(0.32), delay }
                  }}
                  style={{ transformOrigin: `${cell.x + CELL / 2}px ${cell.y + CELL / 2}px` }}
                />
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
                  <text x={tooltipX + 12} y={tooltipY + 19} className="matos-tooltip-value">
                    {valueFormatter(active.value)}
                  </text>
                  <text x={tooltipX + 12} y={tooltipY + 35} className="matos-tooltip-label">
                    {active.label}
                  </text>
                </motion.g>
              ) : null}
            </AnimatePresence>
          </svg>
        ) : null}
      </div>
      <div className="matos-heatmap-legend" aria-hidden="true">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className="matos-legend-cell" data-level={level} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}
