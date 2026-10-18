"use client";

import { Pause, Play, Timer, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Focus mode (ADR 0069, lab 8.12): 25 minutes with the tab bar hidden, then a 5-minute breathing break.
 * Ephemeral and local: nothing is recorded or sent.
 */
export const FOCUS_MINUTES = 25, BREAK_MINUTES = 5;
type Phase = "focus" | "break";
type Clock = Readonly<{ phase: Phase; endsAt: number | null; leftMs: number }>;

export function focusLabel(leftMs: number) {
  const total = Math.max(0, Math.ceil(leftMs / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const fresh = (phase: Phase): Clock => ({ phase, endsAt: Date.now() + (phase === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60000, leftMs: (phase === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60000 });

export function FocusMode() {
  const [clock, setClock] = useState<Clock | null>(null);
  const on = clock !== null;
  useEffect(() => {
    if (!on) return;
    document.documentElement.dataset.focusMode = "on";
    return () => { delete document.documentElement.dataset.focusMode; };
  }, [on]);
  useEffect(() => {
    if (!clock?.endsAt) return;
    const tick = window.setInterval(() => setClock(current => {
      if (!current?.endsAt) return current;
      const leftMs = current.endsAt - Date.now();
      if (leftMs > 0) return { ...current, leftMs };
      return current.phase === "focus" ? fresh("break") : null;
    }), 500);
    return () => window.clearInterval(tick);
  }, [clock?.endsAt]);
  if (!clock) return <button type="button" className="focus-mode-toggle" aria-pressed="false" onClick={() => setClock(fresh("focus"))}><Timer aria-hidden="true" /><span className="tool-label">Modo foco</span></button>;
  const total = (clock.phase === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60000;
  const ring = 2 * Math.PI * 22, offset = ring * (1 - clock.leftMs / total);
  const paused = clock.endsAt === null;
  return (
    <>
      <button type="button" className="focus-mode-toggle" aria-pressed="true" onClick={() => setClock(null)}><Timer aria-hidden="true" /><span className="tool-label">Sair do foco</span></button>
      <div className="focus-pill" data-phase={clock.phase} role="timer" aria-label={clock.phase === "focus" ? `Foco: faltam ${focusLabel(clock.leftMs)}` : `Pausa: faltam ${focusLabel(clock.leftMs)}`}>
        <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="22" className="focus-track" /><circle cx="26" cy="26" r="22" className="focus-fill" strokeDasharray={ring} strokeDashoffset={offset} transform="rotate(-90 26 26)" /></svg>
        <span className="focus-text"><strong>{focusLabel(clock.leftMs)}</strong><small>{clock.phase === "focus" ? (paused ? "pausado" : "foco") : "respire"}</small></span>
        {clock.phase === "focus" ? (
          <button type="button" className="focus-pill-button" aria-label={paused ? "Retomar foco" : "Pausar foco"} onClick={() => setClock(paused ? { ...clock, endsAt: Date.now() + clock.leftMs } : { ...clock, endsAt: null })}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}</button>
        ) : null}
        <button type="button" className="focus-pill-button" aria-label="Sair do modo foco" onClick={() => setClock(null)}><X aria-hidden="true" /></button>
      </div>
    </>
  );
}
