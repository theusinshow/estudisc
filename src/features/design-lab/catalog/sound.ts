/** Opt-in feedback sounds synthesized with Web Audio (no files, no dependency). Never a buzzer. */
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
