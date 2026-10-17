"use client";

import { useEffect, useRef } from "react";

import { getStudyPreferences } from "./preferences";

/** Short synthesized tones (Web Audio, no files). A gentle low tone for "not yet" — never a buzzer. */
let context: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, volume: number, type: OscillatorType = "triangle") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export type FeedbackSound = "correct" | "wrong" | "tap" | "celebrate";

export function playFeedback(kind: FeedbackSound) {
  const ctx = audio();
  if (!ctx) return;
  void ctx.resume();
  const now = ctx.currentTime;
  if (kind === "correct") { tone(ctx, 660, now, 0.12, 0.18); tone(ctx, 990, now + 0.09, 0.18, 0.16); }
  if (kind === "wrong") tone(ctx, 220, now, 0.22, 0.12, "sine");
  if (kind === "tap") tone(ctx, 520, now, 0.05, 0.06, "sine");
  if (kind === "celebrate") [523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, now + i * 0.08, 0.2, 0.14));
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

/** Plays the student's chosen signals once per new attempt result (keyed by attempt id). */
export function useFeedbackSignals(result: "correct" | "incorrect" | "solution" | null, attemptKey: string | undefined) {
  const last = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!attemptKey || last.current === attemptKey || (result !== "correct" && result !== "incorrect")) return;
    last.current = attemptKey;
    const preferences = getStudyPreferences();
    if (preferences.sound) playFeedback(result === "correct" ? "correct" : "wrong");
    if (preferences.haptics && result === "correct") vibrate(30);
  }, [result, attemptKey]);
}
