"use client";

import { Check, Copy, Download, Lock, Share2, Smartphone, Users, Vibrate } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/* 9.2 — Exam pace: compares answered questions with the IFSC average time per question; floating answer sheet. */
const TOTAL_Q = 28, TOTAL_MIN = 240, PER_Q = TOTAL_MIN / TOTAL_Q;

export function ExamPace() {
  const [elapsed, setElapsed] = useState(60);
  const [marks, setMarks] = useState<Record<number, string>>({ 1: "B", 2: "D", 3: "A", 4: "C", 5: "B", 6: "E" });
  const [sheetOpen, setSheetOpen] = useState(false);
  const answered = Object.keys(marks).length;
  const diff = Math.round(answered * PER_Q - elapsed);
  const status = diff >= 3 ? "ahead" : diff <= -3 ? "behind" : "on";
  return (
    <div className="ix2-pace">
      <div className="ix2-pace-bar" data-status={status}>
        <div><strong>{Math.floor((TOTAL_MIN - elapsed) / 60)}h{String((TOTAL_MIN - elapsed) % 60).padStart(2, "0")}</strong><small>restantes</small></div>
        <div><strong>{answered}/{TOTAL_Q}</strong><small>respondidas</small></div>
        <div className="ix2-pace-status" role="status">{status === "ahead" ? `${diff} min adiantado` : status === "behind" ? `${-diff} min atrasado` : "no ritmo"}</div>
      </div>
      <p className="dc-note">Ritmo do IFSC: cerca de {PER_Q.toFixed(1).replace(".", ",")} min por questão (4 h para 28).</p>
      <div className="dc-row">
        <button type="button" className="secondary-button" onClick={() => setElapsed((e) => Math.min(TOTAL_MIN, e + 15))}>+15 min</button>
        <button type="button" className="secondary-button" onClick={() => setSheetOpen(true)}>Abrir folha de respostas</button>
      </div>
      <AnimatePresence>
        {sheetOpen ? (
          <motion.div key="sheet" className="ix2-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 36 }} role="dialog" aria-label="Folha de respostas">
            <div className="ix2-sheet-head"><strong>Folha de respostas</strong><button type="button" className="text-button" onClick={() => setSheetOpen(false)}>Fechar</button></div>
            <ol className="ix2-sheet-grid">
              {Array.from({ length: TOTAL_Q }, (_, i) => i + 1).map((n) => (
                <li key={n}>
                  <button type="button" className="ix2-bubble" data-marked={Boolean(marks[n])} aria-label={`Questão ${n}${marks[n] ? `, marcada ${marks[n]}` : ""}`}
                    onClick={() => setMarks((m) => (m[n] ? Object.fromEntries(Object.entries(m).filter(([k]) => Number(k) !== n)) : { ...m, [n]: "ABCDE"[n % 5] }))}>
                    <span>{n}</span>{marks[n] ? <b>{marks[n]}</b> : null}
                  </button>
                </li>
              ))}
            </ol>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* 9.8 — Weekly recap stories + a ready-to-post image (drawn on a canvas, saved on the device). */
const STORIES = [
  { kicker: "Sua semana", big: "5 dias", line: "de estudo · 2 h 40 min", tone: "signal" },
  { kicker: "Mais evoluiu", big: "Porcentagem", line: "de 38% para 62% de domínio", tone: "mathematics" },
  { kicker: "Pontos cegos resolvidos", big: "3", line: "você tinha certeza e errou, e corrigiu", tone: "portuguese" },
  { kicker: "Faltam", big: "42 dias", line: "para a prova do IFSC", tone: "science" }
] as const;
const TONES: Record<string, string> = { signal: "#FFE135", mathematics: "#FF7357", portuguese: "#B08CFF", science: "#4CC96B" };

function drawStoryImage(): Promise<Blob | null> {
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1920;
  const ctx = c.getContext("2d"); if (!ctx) return Promise.resolve(null);
  // next/font self-hosts Archivo under a generated family name; reuse the one the page actually uses.
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const font = (weight: number, size: number) => `${weight} ${size}px ${family}`;
  ctx.fillStyle = "#D4FF4F"; ctx.fillRect(0, 0, 1080, 1920);
  const card = (y: number, h: number, color: string) => { ctx.fillStyle = "#17141F"; ctx.beginPath(); ctx.roundRect(96, y + 14, 888, h, 48); ctx.fill(); ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(80, y, 888, h, 48); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = "#17141F"; ctx.stroke(); };
  ctx.fillStyle = "#17141F";
  let titleSize = 80; do { ctx.font = font(900, titleSize); titleSize -= 2; } while (ctx.measureText("Minha semana no Estudisc").width > 920 && titleSize > 40);
  ctx.fillText("Minha semana no Estudisc", 80, 200);
  STORIES.forEach((s, i) => {
    const y = 300 + i * 360; card(y, 300, TONES[s.tone]);
    ctx.fillStyle = "#17141F"; ctx.font = font(800, 40); ctx.fillText(s.kicker.toUpperCase(), 130, y + 80);
    ctx.font = font(900, 96); ctx.fillText(s.big, 130, y + 190);
    ctx.font = font(600, 38); ctx.fillText(s.line, 130, y + 255);
  });
  ctx.font = font(800, 44); ctx.fillText("estudisc.com.br", 80, 1820);
  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

export function WeeklyRecap() {
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => { const t = window.setTimeout(() => setIndex((i) => (i + 1) % STORIES.length), 4000); return () => window.clearTimeout(t); }, [index]);
  async function share() {
    setSaving(true);
    const blob = await drawStoryImage(); setSaving(false);
    if (!blob) return;
    const file = new File([blob], "minha-semana-estudisc.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) { await nav.share({ files: [file], title: "Minha semana no Estudisc" }).catch(() => {}); return; }
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
  }
  const story = STORIES[index];
  return (
    <div className="ix2-recap">
      <div className="ix2-story" data-tone={story.tone}>
        <ol className="ix2-story-progress" aria-hidden="true">{STORIES.map((s, i) => <li key={s.kicker} data-state={i < index ? "done" : i === index ? "now" : "next"}><span key={`${index}-${i}`} /></li>)}</ol>
        <button type="button" className="ix2-story-tap" data-side="prev" aria-label="Anterior" onClick={() => setIndex((i) => Math.max(0, i - 1))} />
        <button type="button" className="ix2-story-tap" data-side="next" aria-label="Próximo" onClick={() => setIndex((i) => (i + 1) % STORIES.length)} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={index} className="ix2-story-body" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.25 }} aria-live="polite">
            <p className="type-meta">{story.kicker}</p><strong>{story.big}</strong><p>{story.line}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <button type="button" className="primary-button" disabled={saving} onClick={() => void share()}>{saving ? "Gerando…" : <><Share2 aria-hidden="true" />Postar no story</>}</button>
      <p className="dc-note"><Download aria-hidden="true" className="ix2-inline-icon" />No celular abre o compartilhar; no computador baixa a imagem (1080×1920).</p>
    </div>
  );
}

/* 9.9 — Sticker album: each sticker is tied to something real you learned. */
const STICKERS = [
  { id: "s1", label: "Mestre da %", why: "Dominou Porcentagem", tone: "mathematics", got: true },
  { id: "s2", label: "Leitor atento", why: "10 inferências certas", tone: "portuguese", got: true },
  { id: "s3", label: "Caçador de pontos cegos", why: "Corrigiu 3 pontos cegos", tone: "science", got: false },
  { id: "s4", label: "Viajante do tempo", why: "Linha do tempo do Brasil", tone: "history-geography", got: false },
  { id: "s5", label: "Simulado completo", why: "Fez um simulado inteiro", tone: "mathematics", got: false },
  { id: "s6", label: "5 dias na semana", why: "Bateu a meta semanal", tone: "portuguese", got: true }
] as const;

export function StickerAlbum() {
  const [owned, setOwned] = useState<Set<string>>(new Set(STICKERS.filter((s) => s.got).map((s) => s.id)));
  const [fresh, setFresh] = useState<string | null>(null);
  const next = STICKERS.find((s) => !owned.has(s.id));
  return (
    <div className="ix2-album">
      <ul className="ix2-album-grid">
        {STICKERS.map((s) => (
          <li key={s.id}>
            {owned.has(s.id) ? (
              <motion.figure className="ix2-sticker" data-subject={s.tone} initial={fresh === s.id ? { scale: 0.2, rotate: -40, opacity: 0 } : false} animate={{ scale: 1, rotate: s.id.charCodeAt(1) % 2 ? 4 : -4, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>
                <span className="ix2-sticker-face">{s.label}</span><figcaption>{s.why}</figcaption>
              </motion.figure>
            ) : (
              <figure className="ix2-sticker" data-locked="true"><span className="ix2-sticker-face"><Lock aria-hidden="true" /></span><figcaption>{s.why}</figcaption></figure>
            )}
          </li>
        ))}
      </ul>
      <button type="button" className="secondary-button" disabled={!next} onClick={() => { if (next) { setOwned((o) => new Set(o).add(next.id)); setFresh(next.id); } }}>{next ? "Simular conquista" : "Álbum completo!"}</button>
    </div>
  );
}

/* 9.10 — Challenge a friend: same 5 questions, compare only at the end, no public ranking. */
export function FriendChallenge() {
  const [stage, setStage] = useState<"idle" | "created" | "result">("idle");
  const [copied, setCopied] = useState(false);
  const me = [1, 1, 0, 1, 1], friend = [1, 0, 0, 1, 1];
  return (
    <div className="ix2-challenge">
      {stage === "idle" ? <button type="button" className="primary-button" onClick={() => setStage("created")}><Users aria-hidden="true" />Desafiar um amigo</button> : null}
      {stage !== "idle" ? (
        <div className="ix2-link">
          <span>estudisc.com.br/d/K7Q2</span>
          <button type="button" className="dc-icon-button" aria-label="Copiar link" onClick={() => { void navigator.clipboard?.writeText("https://www.estudisc.com.br/d/K7Q2").then(() => setCopied(true)); }}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</button>
        </div>
      ) : null}
      {stage === "created" ? <button type="button" className="secondary-button" onClick={() => setStage("result")}>Ver resultado (exemplo)</button> : null}
      {stage === "result" ? (
        <motion.div className="ix2-compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {[["Você", me], ["Bia", friend]].map(([name, row]) => (
            <div key={name as string} className="ix2-compare-row"><strong>{name as string}</strong><ol>{(row as number[]).map((ok, i) => <li key={i} data-ok={Boolean(ok)}>{i + 1}</li>)}</ol></div>
          ))}
          <p className="ix-feedback">Vocês dois erraram a questão 3: que tal rever juntos?</p>
        </motion.div>
      ) : null}
    </div>
  );
}

/* 9.12 — Night mode: the same components with dark tokens (scoped preview). */
export function NightPreview() {
  const [night, setNight] = useState(true);
  return (
    <div className="ix2-night-wrap">
      <button type="button" className="ix2-switch" role="switch" aria-checked={night} onClick={() => setNight((n) => !n)}>
        <span className="ix2-switch-track"><motion.span className="ix2-switch-thumb" layout transition={{ type: "spring", stiffness: 600, damping: 32 }} /></span>{night ? "Modo noite" : "Modo dia"}
      </button>
      <div className="ix2-night" data-night={night}>
        <article className="ix2-n-card"><span className="dc-sticker" data-subject="science">Ciências</span><strong>Movimento</strong><small>Aula 10 de 12</small></article>
        <div className="ix2-n-answer"><span className="dc-letter">A</span>29 em cada 100</div>
        <button type="button" className="primary-button">Continuar</button>
      </div>
    </div>
  );
}

/* 9.13 — Light vibration on correct/submit (Android; iOS Safari ignores it). */
export function HapticsDemo() {
  const supported = typeof navigator !== "undefined" && "vibrate" in navigator;
  return (
    <div className="ix2-haptics">
      <p className="dc-note"><Smartphone aria-hidden="true" className="ix2-inline-icon" />{supported ? "Seu aparelho aceita vibração." : "Este navegador não vibra (iPhone e computador ignoram)."}</p>
      <div className="dc-row">
        <button type="button" className="secondary-button" disabled={!supported} onClick={() => navigator.vibrate(30)}><Vibrate aria-hidden="true" />Acerto</button>
        <button type="button" className="secondary-button" disabled={!supported} onClick={() => navigator.vibrate([40, 60, 40])}><Vibrate aria-hidden="true" />Entrega</button>
      </div>
    </div>
  );
}
