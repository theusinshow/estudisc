"use client";

import { Check, Minus, Plus, RotateCcw, Sun } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useId, useRef, useState } from "react";

const SPRING = { type: "spring", stiffness: 260, damping: 18 } as const;

/* 9.4 — Equation balance: x + 3 = 7. Guess x or remove the same weight from both sides. */
export function EquationBalance() {
  const [x, setX] = useState(1);
  const [taken, setTaken] = useState(0);
  const left = x + 3 - taken, right = 7 - taken;
  const tilt = Math.max(-14, Math.min(14, (right - left) * 4));
  const balanced = left === right;
  return (
    <div className="ix2-balance">
      <p className="ix2-equation" aria-live="polite"><span className="ix2-x">x</span>{3 - taken > 0 ? ` + ${3 - taken}` : ""} = {right}</p>
      <div className="ix2-scale" aria-hidden="true">
        <motion.div className="ix2-beam" animate={{ rotate: tilt }} transition={SPRING}>
          <div className="ix2-pan" data-side="left"><span className="ix2-box">x</span>{Array.from({ length: 3 - taken }, (_, i) => <span key={i} className="ix2-weight" />)}</div>
          <div className="ix2-pan" data-side="right">{Array.from({ length: right }, (_, i) => <span key={i} className="ix2-weight" />)}</div>
        </motion.div>
        <span className="ix2-stand" />
      </div>
      <div className="dc-row">
        <div className="ix2-seg" aria-label="Valor de x">
          <button type="button" aria-label="Diminuir x" disabled={x <= 0} onClick={() => setX((v) => v - 1)}><Minus aria-hidden="true" /></button>
          <span>x = {x}</span>
          <button type="button" aria-label="Aumentar x" disabled={x >= 9} onClick={() => setX((v) => v + 1)}><Plus aria-hidden="true" /></button>
        </div>
        <button type="button" className="secondary-button" disabled={taken >= 3} onClick={() => setTaken((t) => t + 1)}>Tirar 1 dos dois lados</button>
        <button type="button" className="text-button" onClick={() => { setX(1); setTaken(0); }}><RotateCcw aria-hidden="true" />Recomeçar</button>
      </div>
      <p role="status" className={balanced ? "ix-ok" : "ix-feedback"}>{balanced ? <><Check aria-hidden="true" />Equilibrou! x = {x}.</> : left > right ? "O lado do x está mais pesado: diminua x." : "O lado do x está mais leve: aumente x."}</p>
    </div>
  );
}

/* 9.5 — Linear function: drag two points (or focus one and use arrows); the equation follows. */
const RANGE = 5, CELL = 28, SIZE = RANGE * 2 * CELL;
const toPx = (v: number) => (v + RANGE) * CELL;
const toPy = (v: number) => (RANGE - v) * CELL;

function formatLine(a: number, b: number) {
  if (!Number.isFinite(a)) return "reta vertical";
  const slope = Number.isInteger(a) ? String(a) : a.toFixed(2).replace(".", ",");
  const ax = a === 0 ? "" : a === 1 ? "x" : a === -1 ? "−x" : `${slope.replace("-", "−")}x`;
  const bb = b === 0 ? "" : `${ax ? (b > 0 ? " + " : " − ") : b < 0 ? "−" : ""}${Math.abs(b)}`;
  return `y = ${ax}${bb}` || "y = 0";
}

export function LinearGraph() {
  const [points, setPoints] = useState<[number, number][]>([[0, 1], [2, 2]]);
  const dragging = useRef<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [[x1, y1], [x2, y2]] = points;
  const a = (y2 - y1) / (x2 - x1), b = y1 - a * x1;
  const target = Number.isFinite(a) && a === 2 && b === -1;
  function move(i: number, p: [number, number]) {
    const clamped: [number, number] = [Math.max(-RANGE, Math.min(RANGE, p[0])), Math.max(-RANGE, Math.min(RANGE, p[1]))];
    setPoints((current) => (current[1 - i][0] === clamped[0] && current[1 - i][1] === clamped[1] ? current : current.map((q, j) => (j === i ? clamped : q))));
  }
  function fromEvent(event: React.PointerEvent): [number, number] {
    const rect = svg.current!.getBoundingClientRect(); const scale = SIZE / rect.width;
    return [Math.round(((event.clientX - rect.left) * scale) / CELL - RANGE), Math.round(RANGE - ((event.clientY - rect.top) * scale) / CELL)];
  }
  const ext = (x: number) => [toPx(x), toPy(a * x + b)];
  return (
    <div className="ix2-graph">
      <p className="ix2-q">Desafio: faça a reta <strong>y = 2x − 1</strong></p>
      <svg ref={svg} viewBox={`0 0 ${SIZE} ${SIZE}`} className="ix2-plane" role="img" aria-label={`Gráfico: ${formatLine(a, b)}`}
        onPointerMove={(event) => { if (dragging.current !== null) move(dragging.current, fromEvent(event)); }}
        onPointerUp={() => { dragging.current = null; }} onPointerLeave={() => { dragging.current = null; }}>
        {Array.from({ length: RANGE * 2 + 1 }, (_, i) => <g key={i}><line x1={i * CELL} y1={0} x2={i * CELL} y2={SIZE} className="ix2-gridline" /><line x1={0} y1={i * CELL} x2={SIZE} y2={i * CELL} className="ix2-gridline" /></g>)}
        <line x1={0} y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} className="ix2-axis" /><line x1={SIZE / 2} y1={0} x2={SIZE / 2} y2={SIZE} className="ix2-axis" />
        {Number.isFinite(a) ? <line x1={ext(-RANGE)[0]} y1={ext(-RANGE)[1]} x2={ext(RANGE)[0]} y2={ext(RANGE)[1]} className="ix2-fn" data-target={target} /> : null}
        {points.map(([px, py], i) => (
          <g key={i} tabIndex={0} role="slider" aria-label={`Ponto ${i + 1}`} aria-valuetext={`x ${px}, y ${py}`} className="ix2-handle"
            onPointerDown={(event) => { dragging.current = i; (event.currentTarget as Element).setPointerCapture?.(event.pointerId); }}
            onKeyDown={(event) => { const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }; const m = d[event.key]; if (m) { event.preventDefault(); move(i, [px + m[0], py + m[1]]); } }}>
            <circle cx={toPx(px)} cy={toPy(py)} r={13} className="ix2-dot" data-i={i} />
          </g>
        ))}
      </svg>
      <p className="ix2-fn-label" aria-live="polite">{formatLine(a, b)}{target ? <span className="ix-ok"><Check aria-hidden="true" />Isso!</span> : null}</p>
      <p className="dc-note">Inclinação a = (y₂ − y₁) ÷ (x₂ − x₁) = {Number.isFinite(a) ? (Number.isInteger(a) ? a : a.toFixed(2).replace(".", ",")) : "—"}</p>
    </div>
  );
}

/* 9.6 — Time zones: move the Sun (UTC hour); each city shows its local time and day/night. */
const CITIES = [["Nova York", -5], ["Manaus", -4], ["Florianópolis", -3], ["Noronha", -2], ["Lisboa", 0], ["Tóquio", 9]] as const;

export function TimeZones() {
  const id = useId();
  const [utc, setUtc] = useState(15);
  return (
    <div className="ix2-zones">
      <label className="ix2-sun-track" htmlFor={id}>
        <span className="visually-hidden">Hora em Greenwich (UTC)</span>
        <motion.span className="ix2-sun" aria-hidden="true" animate={{ left: `${(utc / 23) * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }}><Sun /></motion.span>
        <input id={id} type="range" min={0} max={23} value={utc} onChange={(event) => setUtc(Number(event.target.value))} aria-valuetext={`${utc} horas em Greenwich`} />
      </label>
      <p className="dc-note">Greenwich (UTC): <strong>{String(utc).padStart(2, "0")}:00</strong> · arraste o Sol</p>
      <ul className="ix2-cities">
        {CITIES.map(([name, offset]) => {
          const local = (utc + offset + 24) % 24; const day = local >= 6 && local < 18;
          return (
            <motion.li key={name} layout className="ix2-city" data-day={day}>
              <strong>{name}</strong><span className="ix2-clock">{String(local).padStart(2, "0")}:00</span><small>{day ? "dia" : "noite"} · UTC{offset >= 0 ? "+" : "−"}{Math.abs(offset)}</small>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/* 9.7 — Build the sentence: tap words in order (they fly into the line); tap again to send back. */
const SENTENCE = ["Os", "alunos", "estudaram", "geometria", "ontem."];
const SHUFFLED_WORDS = [3, 0, 4, 2, 1];

export function SentenceBuilder() {
  const [line, setLine] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const bank = SHUFFLED_WORDS.filter((i) => !line.includes(i));
  const correct = line.length === SENTENCE.length && line.every((w, i) => w === i);
  const chip = (i: number, inLine: boolean) => (
    <motion.button key={i} layoutId={`w-${i}`} type="button" className="ix2-chip" transition={{ type: "spring", stiffness: 500, damping: 34 }}
      data-state={checked && inLine ? (line.indexOf(i) === i ? "right" : "wrong") : "idle"}
      onClick={() => { setChecked(false); setLine((l) => (inLine ? l.filter((w) => w !== i) : [...l, i])); }}>
      {SENTENCE[i]}
    </motion.button>
  );
  return (
    <LayoutGroup>
      <div className="ix2-sentence">
        <p className="ix2-q">Monte a frase na ordem natural.</p>
        <div className="ix2-line" aria-label="Sua frase">{line.length ? line.map((i) => chip(i, true)) : <span className="dc-note">Toque nas palavras abaixo.</span>}</div>
        <div className="ix2-bank" aria-label="Palavras">{bank.map((i) => chip(i, false))}</div>
        <div className="dc-row">
          <button type="button" className="primary-button" disabled={line.length !== SENTENCE.length} onClick={() => setChecked(true)}>Conferir</button>
          <button type="button" className="text-button" onClick={() => { setLine([]); setChecked(false); }}><RotateCcw aria-hidden="true" />Recomeçar</button>
        </div>
        <AnimatePresence>
          {checked ? <motion.p key={String(correct)} role="status" className={correct ? "ix-ok" : "ix-feedback"} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{correct ? <><Check aria-hidden="true" />Sujeito (Os alunos) + verbo (estudaram) + complemento.</> : "Quase: comece pelo sujeito, depois o verbo."}</motion.p> : null}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
