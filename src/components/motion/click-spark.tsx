"use client";

/**
 * Adapted from React Bits ClickSpark (https://reactbits.dev/animations/click-spark): positioning lives in
 * CSS classes (the CSP blocks server-rendered styles), the canvas is DPR-scaled, the frame loop runs only
 * while sparks are alive, keyboard activation sparks from the target's center and reduced motion opts out.
 */
import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";

import "./motion.css";

type Spark = { x: number; y: number; angle: number; start: number };

type ClickSparkProps = Readonly<{
  children: ReactNode;
  className?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
}>;

export function ClickSpark({ children, className, sparkSize = 12, sparkRadius = 22, sparkCount = 8, duration = 420 }: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();

    return () => {
      observer.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);


  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!(event.target instanceof Element) || !event.target.closest("button, a")) return;

    const bounds = canvas.getBoundingClientRect();
    // Keyboard activation reports detail 0 and no pointer position, so spark from the control's center.
    const origin = event.detail === 0 ? event.target.closest("button, a")!.getBoundingClientRect() : null;
    const x = origin ? origin.left + origin.width / 2 - bounds.left : event.clientX - bounds.left;
    const y = origin ? origin.top + origin.height / 2 - bounds.top : event.clientY - bounds.top;
    // Event timestamps share the requestAnimationFrame time origin.
    const start = event.timeStamp;

    sparks.current.push(...Array.from({ length: sparkCount }, (_, index) => ({ x, y, angle: (2 * Math.PI * index) / sparkCount, start })));
    if (frame.current === null) frame.current = requestAnimationFrame(draw);
  }

  function draw(timestamp: number) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = getComputedStyle(canvas).color;
    context.lineWidth = 2.5;
    context.lineCap = "round";

    sparks.current = sparks.current.filter((spark) => {
      const progress = (timestamp - spark.start) / duration;
      if (progress >= 1) return false;
      const eased = 1 - Math.pow(1 - Math.max(progress, 0), 3);
      const distance = eased * sparkRadius;
      const length = sparkSize * (1 - eased);
      context.beginPath();
      context.moveTo(spark.x + distance * Math.cos(spark.angle), spark.y + distance * Math.sin(spark.angle));
      context.lineTo(spark.x + (distance + length) * Math.cos(spark.angle), spark.y + (distance + length) * Math.sin(spark.angle));
      context.stroke();
      return true;
    });

    // The loop stops as soon as the last spark fades, unlike the upstream always-on frame loop.
    frame.current = sparks.current.length > 0 ? requestAnimationFrame(draw) : null;
  }

  return (
    <div className={["click-spark", className].filter(Boolean).join(" ")} onClick={handleClick}>
      <canvas ref={canvasRef} className="click-spark-canvas" aria-hidden="true" />
      {children}
    </div>
  );
}
