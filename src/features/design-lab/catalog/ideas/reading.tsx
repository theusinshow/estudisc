"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useRef, useState } from "react";

/* 8.7 — Highlight the words that prove the answer (evidence-based reading). */
const TEXT = "Ana olhou o relógio, pegou a mochila correndo e saiu sem tomar café. No ponto, o ônibus já virava a esquina.";
const WORDS = TEXT.split(" ");
/* Evidence: "pegou a mochila correndo", "saiu sem tomar café", "o ônibus já virava a esquina". */
const EVIDENCE = new Set([4, 5, 6, 7, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20]);

export function EvidenceHighlighter() {
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);
  const [reveal, setReveal] = useState(false);
  const hits = [...marked].filter((i) => EVIDENCE.has(i)).length;
  const extras = marked.size - hits;
  function toggle(i: number) {
    setMarked((current) => { const next = new Set(current); if (next.has(i)) next.delete(i); else next.add(i); return next; });
    setChecked(false); setReveal(false);
  }
  return (
    <div className="ix-highlight">
      <h4>Que trechos mostram que Ana estava atrasada?</h4>
      <p className="ix-passage" aria-label="Texto: toque nas palavras para marcar">
        {WORDS.map((word, i) => (
          <button key={i} type="button" className="ix-word" aria-pressed={marked.has(i)} data-state={checked && marked.has(i) ? (EVIDENCE.has(i) ? "right" : "extra") : "idle"} data-evidence={reveal && EVIDENCE.has(i)} onClick={() => toggle(i)}>
            <motion.span className="ix-ink" aria-hidden="true" initial={false} animate={{ scaleX: marked.has(i) ? 1 : 0 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }} />
            <span className="ix-word-text">{word}</span>
          </button>
        ))}
      </p>
      <div className="dc-row">
        <button type="button" className="primary-button" disabled={marked.size === 0} onClick={() => setChecked(true)}>Conferir</button>
        {checked && !reveal ? <button type="button" className="secondary-button" onClick={() => setReveal(true)}>Mostrar as pistas</button> : null}
        <button type="button" className="text-button" onClick={() => { setMarked(new Set()); setChecked(false); setReveal(false); }}><RotateCcw aria-hidden="true" />Limpar</button>
      </div>
      <p role="status" className="ix-feedback">
        {checked ? (hits >= 8 && extras <= 2 ? "Boa leitura! Correr, sair sem café e o ônibus indo embora são as pistas." : hits > 0 ? `Você achou parte das pistas (${hits} palavras). Procure ações apressadas.` : "Procure o que Ana fez com pressa.") : " "}
      </p>
    </div>
  );
}

/* 8.8 — Drag the timeline; the event under the center line comes forward. Buttons step for keyboard/touch. */
const EVENTS = [
  { year: 1500, title: "Chegada dos portugueses", note: "Cabral chega à costa da Bahia." },
  { year: 1822, title: "Independência", note: "Brasil deixa de ser colônia de Portugal." },
  { year: 1888, title: "Lei Áurea", note: "Abolição formal da escravidão." },
  { year: 1889, title: "República", note: "Fim do Império." },
  { year: 1988, title: "Constituição Cidadã", note: "Constituição atual do Brasil." }
];
const STEP = 120;

export function DraggableTimeline() {
  const x = useMotionValue(0);
  const [active, setActive] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  useMotionValueEvent(x, "change", (value) => {
    const i = Math.max(0, Math.min(EVENTS.length - 1, Math.round(-value / STEP)));
    if (i !== active) setActive(i);
  });
  function go(i: number) { const next = Math.max(0, Math.min(EVENTS.length - 1, i)); setActive(next); void animate(x, -next * STEP, { type: "spring", stiffness: 300, damping: 30 }); }
  const event = EVENTS[active];
  return (
    <div className="ix-timeline">
      <div className="ix-tl-frame" ref={frame}>
        <span className="ix-tl-center" aria-hidden="true" />
        <motion.ol className="ix-tl-track" drag="x" style={{ x }} dragConstraints={{ left: -(EVENTS.length - 1) * STEP, right: 0 }} dragElastic={0.1}
          onDragEnd={() => go(Math.round(-x.get() / STEP))} aria-label="Linha do tempo">
          {EVENTS.map((item, i) => (
            <li key={item.year} className="ix-tl-item" data-active={i === active}>
              <span className="ix-tl-dot" aria-hidden="true" /><strong>{item.year}</strong>
            </li>
          ))}
        </motion.ol>
      </div>
      <div className="ix-tl-detail" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={event.year} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            <p className="type-meta">{event.year}</p><h4>{event.title}</h4><p>{event.note}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="dc-row">
        <button type="button" className="secondary-button" disabled={active === 0} onClick={() => go(active - 1)}><ChevronLeft aria-hidden="true" />Antes</button>
        <button type="button" className="secondary-button" disabled={active === EVENTS.length - 1} onClick={() => go(active + 1)}>Depois<ChevronRight aria-hidden="true" /></button>
      </div>
    </div>
  );
}
