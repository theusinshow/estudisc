"use client";

import { Pause, Play, Share2 } from "lucide-react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import type { RecapStory } from "./weekly-recap";

const TONES: Record<RecapStory["tone"], string> = { signal: "#FFE135", mathematics: "#FF7357", portuguese: "#B08CFF", science: "#4CC96B" };

/** Draws the recap as a 1080×1920 story image with the page's own font (next/font self-hosts it under a generated name). */
function drawStoryImage(stories: readonly RecapStory[]): Promise<Blob | null> {
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1920;
  const ctx = c.getContext("2d"); if (!ctx) return Promise.resolve(null);
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const font = (weight: number, size: number) => `${weight} ${size}px ${family}`;
  const fit = (text: string, weight: number, size: number, width: number) => { let s = size; do { ctx.font = font(weight, s); s -= 2; } while (ctx.measureText(text).width > width && s > 28); };
  ctx.fillStyle = "#D4FF4F"; ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = "#17141F"; fit("Minha semana no Estudisc", 900, 80, 920); ctx.fillText("Minha semana no Estudisc", 80, 200);
  const step = Math.min(360, 1500 / Math.max(1, stories.length));
  stories.forEach((s, i) => {
    const y = 300 + i * step, h = step - 60;
    ctx.fillStyle = "#17141F"; ctx.beginPath(); ctx.roundRect(96, y + 14, 888, h, 48); ctx.fill();
    ctx.fillStyle = TONES[s.tone]; ctx.beginPath(); ctx.roundRect(80, y, 888, h, 48); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = "#17141F"; ctx.stroke();
    ctx.fillStyle = "#17141F"; ctx.font = font(800, 40); ctx.fillText(s.kicker.toUpperCase(), 130, y + 80);
    fit(s.big, 900, 96, 800); ctx.fillText(s.big, 130, y + 190);
    fit(s.line, 600, 38, 800); ctx.fillText(s.line, 130, y + 250);
  });
  ctx.font = font(800, 44); ctx.fillText("estudisc.com.br", 80, 1820);
  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

export function WeeklyRecapStories({ stories }: Readonly<{ stories: readonly RecapStory[] }>) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [saving, setSaving] = useState(false);
  const auto = playing && !reduce && stories.length > 1;
  useEffect(() => { if (!auto) return; const t = window.setTimeout(() => setIndex((i) => (i + 1) % stories.length), 4000); return () => window.clearTimeout(t); }, [index, auto, stories.length]);
  if (stories.length === 0) return null;
  const story = stories[Math.min(index, stories.length - 1)];

  async function share() {
    setSaving(true);
    const blob = await drawStoryImage(stories); setSaving(false);
    if (!blob) return;
    const file = new File([blob], "minha-semana-estudisc.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) { await nav.share({ files: [file], title: "Minha semana no Estudisc" }).catch(() => {}); return; }
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="recap">
        <div className="recap-story" data-tone={story.tone} data-playing={auto}>
          <ol className="recap-progress" aria-hidden="true">{stories.map((s, i) => <li key={s.kicker} data-state={i < index ? "done" : i === index ? "now" : "next"}><span key={`${index}-${i}`} /></li>)}</ol>
          <button type="button" className="recap-tap" data-side="prev" aria-label="Card anterior" onClick={() => setIndex((i) => Math.max(0, i - 1))} />
          <button type="button" className="recap-tap" data-side="next" aria-label="Próximo card" onClick={() => setIndex((i) => (i + 1) % stories.length)} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={index} className="recap-body" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.25 }} aria-live="polite">
              <p className="type-meta">{story.kicker}</p><strong>{story.big}</strong><p>{story.line}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="recap-actions">
          {!reduce && stories.length > 1 ? <button type="button" className="text-button" onClick={() => setPlaying((p) => !p)}>{playing ? <><Pause aria-hidden="true" />Pausar</> : <><Play aria-hidden="true" />Continuar</>}</button> : null}
          <button type="button" className="primary-button" disabled={saving} onClick={() => void share()}>{saving ? "Gerando…" : <><Share2 aria-hidden="true" />Postar no story</>}</button>
        </div>
      </div>
    </MotionConfig>
  );
}
