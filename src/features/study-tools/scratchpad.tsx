"use client";

import { Eraser, PencilLine, Pencil, Trash2, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

/* Scratchpad next to a question (ADR 0069, lab 9.1): finger or mouse drawing, eraser, three inks, undo.
   Nothing is saved or sent: it is paper for working out, cleared when the question changes. */
type Stroke = { tool: "pen" | "eraser"; color: string; points: [number, number][] };
const INKS = [["#17141F", "Tinta preta"], ["#E2462A", "Tinta vermelha"], ["#1F6FEB", "Tinta azul"]] as const;

export function Scratchpad({ height = 240 }: Readonly<{ height?: number }>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [ink, setInk] = useState<string>(INKS[0][0]);
  const [count, setCount] = useState(0);

  const redraw = useCallback(() => {
    const el = canvas.current; const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, el.width, el.height);
    for (const stroke of [...strokes.current, ...(current.current ? [current.current] : [])]) {
      ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.tool === "eraser" ? 22 : 3.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      stroke.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }, []);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const resize = () => { const ratio = window.devicePixelRatio || 1; el.width = el.clientWidth * ratio; el.height = el.clientHeight * ratio; redraw(); };
    resize();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(resize); observer.observe(el);
    return () => observer.disconnect();
  }, [redraw]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };
  return (
    <div className="scratchpad">
      <canvas ref={canvas} className="scratchpad-canvas" height={height} aria-label="Área de rascunho: desenhe com o dedo ou o mouse" role="img"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); current.current = { tool, color: ink, points: [point(event)] }; redraw(); }}
        onPointerMove={(event) => { if (!current.current) return; current.current.points.push(point(event)); redraw(); }}
        onPointerUp={() => { if (current.current) { strokes.current.push(current.current); current.current = null; setCount(strokes.current.length); redraw(); } }}
        onPointerCancel={() => { current.current = null; redraw(); }} />
      <div className="scratchpad-tools" role="toolbar" aria-label="Ferramentas do rascunho">
        <button type="button" className="scratchpad-tool" aria-pressed={tool === "pen"} onClick={() => setTool("pen")}><Pencil aria-hidden="true" />Lápis</button>
        <button type="button" className="scratchpad-tool" aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")}><Eraser aria-hidden="true" />Borracha</button>
        {INKS.map(([color, label], i) => <button key={color} type="button" className="scratchpad-ink" data-ink={i} aria-label={label} aria-pressed={ink === color && tool === "pen"} onClick={() => { setInk(color); setTool("pen"); }} />)}
        <button type="button" className="scratchpad-tool" disabled={count === 0} onClick={() => { strokes.current.pop(); setCount(strokes.current.length); redraw(); }}><Undo2 aria-hidden="true" />Desfazer</button>
        <button type="button" className="scratchpad-tool" disabled={count === 0} onClick={() => { strokes.current = []; setCount(0); redraw(); }}><Trash2 aria-hidden="true" />Limpar</button>
      </div>
    </div>
  );
}

/** A collapsed "Rascunho" toggle that mounts the scratchpad only when opened. */
export function ScratchpadToggle() {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="scratchpad-toggle">
      <button type="button" className="scratchpad-open" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
        {open ? <X aria-hidden="true" /> : <PencilLine aria-hidden="true" />}{open ? "Fechar rascunho" : "Rascunho"}
      </button>
      {open ? <div id={id}><Scratchpad /></div> : null}
    </div>
  );
}
