"use client";

import { Check, RotateCcw, Target } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useId, useState } from "react";

const SPRING = { type: "spring", stiffness: 500, damping: 30 } as const;

/** 8.1 — A 10×10 grid paints as the slider moves; the same value is shown as %, fraction and decimal. */
export function PercentExplorer() {
  const id = useId();
  const [value, setValue] = useState(29);
  const target = 35;
  const [checked, setChecked] = useState(false);
  const hit = value === target;
  return (
    <div className="ix-percent">
      <p className="ix-challenge"><Target aria-hidden="true" />Desafio: mostre <strong>{target}%</strong> na grade.</p>
      <div className="ix-grid100" role="img" aria-label={`${value} de 100 quadrados pintados`}>
        {Array.from({ length: 100 }, (_, i) => (
          <motion.span key={i} className="ix-cell" initial={false}
            animate={{ scale: i < value ? 1 : 0.82, backgroundColor: i < value ? "var(--estudisc-color-subject-accent-mathematics)" : "#FFFFFF" }}
            transition={{ ...SPRING, delay: Math.abs(i - value) * 0.004 }} />
        ))}
      </div>
      <label className="ix-range" htmlFor={id}>
        <span>Arraste para pintar</span>
        <input id={id} type="range" min={0} max={100} value={value} onChange={(event) => { setValue(Number(event.target.value)); setChecked(false); }} />
      </label>
      <p className="ix-equation" aria-live="polite"><strong>{value}%</strong> = {value}/100 = {(value / 100).toFixed(2).replace(".", ",")}</p>
      <div className="dc-row">
        <button type="button" className="primary-button" onClick={() => setChecked(true)}>Conferir</button>
        {checked ? <span className={hit ? "ix-ok" : "ix-near"} role="status">{hit ? <><Check aria-hidden="true" />Isso! 35 de cada 100.</> : value < target ? `Faltam ${target - value} quadrados.` : `Passou ${value - target} quadrados.`}</span> : null}
      </div>
    </div>
  );
}

/** 8.2 — Drag the marker to 3/4 on a number line; it snaps to tenths of a quarter and tells how close it got. */
export function NumberLine() {
  const id = useId();
  const [value, setValue] = useState(10);
  const [checked, setChecked] = useState(false);
  const target = 75;
  const x = useMotionValue(10);
  const left = useTransform(x, (v) => `${v}%`);
  function update(next: number) {
    const snapped = Math.max(0, Math.min(100, Math.round(next / 5) * 5));
    setValue(snapped); setChecked(false);
    animate(x, snapped, SPRING);
  }
  const distance = Math.abs(value - target);
  return (
    <div className="ix-line">
      <p className="ix-challenge"><Target aria-hidden="true" />Onde fica <strong>3/4</strong>?</p>
      <div className="ix-line-track">
        <div className="ix-line-axis" aria-hidden="true">
          {[0, 25, 50, 75, 100].map((tick) => <span key={tick} className="ix-tick" data-tick={tick}><i />{tick === 0 ? "0" : tick === 100 ? "1" : ""}</span>)}
        </div>
        <motion.span className="ix-marker" style={{ left }} aria-hidden="true" data-state={checked ? (distance === 0 ? "hit" : "miss") : "idle"} />
        {checked ? <motion.span className="ix-target" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING} aria-hidden="true" /> : null}
        <input id={id} className="ix-line-input" type="range" min={0} max={100} step={5} value={value} aria-label="Posição na reta, de 0 a 1"
          aria-valuetext={`${(value / 100).toFixed(2).replace(".", ",")}`} onChange={(event) => update(Number(event.target.value))} />
      </div>
      <div className="dc-row">
        <button type="button" className="primary-button" onClick={() => setChecked(true)}>Conferir</button>
        <button type="button" className="text-button" onClick={() => update(10)}><RotateCcw aria-hidden="true" />Recomeçar</button>
      </div>
      <p role="status" className="ix-feedback">{checked ? (distance === 0 ? "Exato! 3/4 = 0,75: três de quatro partes iguais." : distance <= 10 ? `Muito perto! Você marcou ${(value / 100).toFixed(2).replace(".", ",")}.` : "Dica: divida a reta em 4 partes iguais e conte 3.") : " "}</p>
    </div>
  );
}
