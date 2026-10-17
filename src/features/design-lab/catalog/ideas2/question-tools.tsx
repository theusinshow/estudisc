"use client";

import { Eraser, Minus, Pause, Pencil, Play, Plus, Square, Trash2, Undo2 } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/* 9.1 — Scratchpad next to the question: draw with a finger, erase, undo. */
type Stroke = { tool: "pen" | "eraser"; color: string; points: [number, number][] };
const INKS = ["#17141F", "#E2462A", "#1F6FEB"];

export function Scratchpad() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [ink, setInk] = useState(INKS[0]);
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

  function point(event: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = event.currentTarget.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }
  return (
    <div className="ix2-scratch">
      <p className="ix2-q">Quanto é 15% de 240? <small>Use o rascunho para fazer a conta.</small></p>
      <canvas ref={canvas} className="ix2-canvas" aria-label="Área de rascunho: desenhe com o dedo ou o mouse" role="img"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); current.current = { tool, color: ink, points: [point(event)] }; redraw(); }}
        onPointerMove={(event) => { if (!current.current) return; current.current.points.push(point(event)); redraw(); }}
        onPointerUp={() => { if (current.current) { strokes.current.push(current.current); current.current = null; setCount(strokes.current.length); redraw(); } }}
        onPointerCancel={() => { current.current = null; redraw(); }} />
      <div className="ix2-toolbar" role="toolbar" aria-label="Ferramentas do rascunho">
        <button type="button" className="ix2-tool" aria-pressed={tool === "pen"} onClick={() => setTool("pen")}><Pencil aria-hidden="true" />Lápis</button>
        <button type="button" className="ix2-tool" aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")}><Eraser aria-hidden="true" />Borracha</button>
        {INKS.map((color, i) => <button key={color} type="button" className="ix2-ink" data-ink={i} aria-label={["Tinta preta", "Tinta vermelha", "Tinta azul"][i]} aria-pressed={ink === color && tool === "pen"} onClick={() => { setInk(color); setTool("pen"); }} />)}
        <button type="button" className="ix2-tool" disabled={count === 0} onClick={() => { strokes.current.pop(); setCount(strokes.current.length); redraw(); }}><Undo2 aria-hidden="true" />Desfazer</button>
        <button type="button" className="ix2-tool" disabled={count === 0} onClick={() => { strokes.current = []; setCount(0); redraw(); }}><Trash2 aria-hidden="true" />Limpar</button>
      </div>
    </div>
  );
}

/* 9.3 — After a wrong pick, that option opens and explains the trap. */
const TRAP = [
  { text: "R$ 185", why: "Você tirou 15 reais em vez de 15%. 15% de 200 é 30, não 15." },
  { text: "R$ 170", why: "" },
  { text: "R$ 30", why: "Esse é o valor do desconto, não o preço final. Falta subtrair de 200." },
  { text: "R$ 230", why: "Você somou o desconto. Desconto diminui o preço." }
];

export function TrapExplained() {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <LayoutGroup>
      <div className="ix2-trap">
        <p className="ix2-q">Um tênis de R$ 200 teve 15% de desconto. Quanto ficou?</p>
        <ul className="ix2-trap-list">
          {TRAP.map((option, i) => {
            const state = picked === null ? "idle" : i === 1 ? "correct" : i === picked ? "wrong" : "idle";
            return (
              <motion.li key={option.text} layout className="ix2-trap-item" data-state={state} transition={{ type: "spring", stiffness: 500, damping: 36 }}>
                <button type="button" className="ix2-trap-button" disabled={picked !== null} onClick={() => setPicked(i)}>
                  <span className="dc-letter" aria-hidden="true">{"ABCD"[i]}</span>{option.text}
                </button>
                <AnimatePresence>
                  {state === "wrong" ? (
                    <motion.div key="why" className="ix2-trap-why" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <strong>Por que essa engana</strong><p>{option.why}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
        <p role="status" className="ix-feedback">{picked === null ? "Escolha uma alternativa." : picked === 1 ? "Certo! 200 − 30 = 170." : "A certa é a B: 200 − 30 = 170."}</p>
        {picked !== null ? <button type="button" className="text-button" onClick={() => setPicked(null)}>Tentar outra alternativa</button> : null}
      </div>
    </LayoutGroup>
  );
}

/* 9.11 — Read aloud with the spoken word highlighted, speed and text size (Web Speech API, no cost). */
const PASSAGE = "A fotossíntese é o processo em que as plantas usam a luz do sol, a água e o gás carbônico para produzir glicose. Nesse processo, elas liberam oxigênio para o ambiente.";
const TOKENS = (() => { const out: { word: string; start: number }[] = []; let i = 0; for (const word of PASSAGE.split(" ")) { out.push({ word, start: i }); i += word.length + 1; } return out; })();

export function ReadAloud() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [wordIndex, setWordIndex] = useState(-1);
  const [rate, setRate] = useState(1);
  const [size, setSize] = useState(1);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);
  function play() {
    if (!supported) return;
    if (paused) { window.speechSynthesis.resume(); setPaused(false); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(PASSAGE);
    utterance.lang = "pt-BR"; utterance.rate = rate;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("pt"));
    if (voice) utterance.voice = voice;
    utterance.onboundary = (event) => { let i = 0; while (i + 1 < TOKENS.length && TOKENS[i + 1].start <= event.charIndex) i += 1; setWordIndex(i); };
    utterance.onend = () => { setSpeaking(false); setPaused(false); setWordIndex(-1); };
    window.speechSynthesis.speak(utterance); setSpeaking(true);
  }
  return (
    <div className="ix2-read">
      <div className="ix2-read-controls">
        {speaking && !paused
          ? <button type="button" className="primary-button" onClick={() => { window.speechSynthesis.pause(); setPaused(true); }}><Pause aria-hidden="true" />Pausar</button>
          : <button type="button" className="primary-button" disabled={!supported} onClick={play}><Play aria-hidden="true" />{paused ? "Continuar" : "Ouvir"}</button>}
        <button type="button" className="dc-icon-button" aria-label="Parar leitura" disabled={!speaking} onClick={() => { window.speechSynthesis.cancel(); setSpeaking(false); setPaused(false); setWordIndex(-1); }}><Square aria-hidden="true" /></button>
        <div className="ix2-seg" role="radiogroup" aria-label="Velocidade">
          {[0.8, 1, 1.2].map((r) => <button key={r} type="button" role="radio" aria-checked={rate === r} onClick={() => setRate(r)}>{r === 1 ? "1×" : `${String(r).replace(".", ",")}×`}</button>)}
        </div>
        <div className="ix2-seg" aria-label="Tamanho do texto">
          <button type="button" aria-label="Diminuir texto" disabled={size <= 0.9} onClick={() => setSize((s) => Math.round((s - 0.1) * 10) / 10)}><Minus aria-hidden="true" /></button>
          <span aria-live="polite">{Math.round(size * 100)}%</span>
          <button type="button" aria-label="Aumentar texto" disabled={size >= 1.4} onClick={() => setSize((s) => Math.round((s + 0.1) * 10) / 10)}><Plus aria-hidden="true" /></button>
        </div>
      </div>
      <p className="ix2-read-text" data-size={String(size).replace(".", "-")}>
        {TOKENS.map((token, i) => <span key={i} className="ix2-read-word" data-on={i === wordIndex}>{token.word} </span>)}
      </p>
      {!supported ? <p className="dc-note">Este navegador não tem leitura em voz alta.</p> : <p className="dc-note">Usa a voz do próprio aparelho; não envia o texto para nenhum servidor.</p>}
    </div>
  );
}
