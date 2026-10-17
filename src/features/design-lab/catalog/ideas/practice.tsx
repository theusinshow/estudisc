"use client";

import { ArrowDown, ArrowUp, Check, GripVertical, RotateCcw, Undo2, X } from "lucide-react";
import { animate, AnimatePresence, LayoutGroup, motion, Reorder, useMotionValue, useTransform } from "motion/react";
import { useState } from "react";

const SPRING = { type: "spring", stiffness: 500, damping: 32 } as const;

/* 8.3 — Put the solution steps in order (drag, or the arrow buttons). */
const STEPS = [
  { id: "a", text: "Ler: tênis de R$ 200 com 15% de desconto." },
  { id: "b", text: "Calcular 15% de 200: 0,15 × 200 = 30." },
  { id: "c", text: "Tirar o desconto: 200 − 30 = 170." },
  { id: "d", text: "Responder: o tênis custa R$ 170." }
];
const SHUFFLED = [STEPS[2], STEPS[0], STEPS[3], STEPS[1]];

export function OrderSteps() {
  const [items, setItems] = useState(SHUFFLED);
  const [checked, setChecked] = useState(false);
  const correct = items.every((item, i) => item.id === STEPS[i].id);
  function move(index: number, delta: number) {
    const next = [...items]; const [item] = next.splice(index, 1); next.splice(index + delta, 0, item); setItems(next); setChecked(false);
  }
  return (
    <div className="ix-order">
      <Reorder.Group axis="y" values={items} onReorder={(next) => { setItems(next); setChecked(false); }} className="ix-order-list">
        {items.map((item, index) => (
          <Reorder.Item key={item.id} value={item} className="ix-step" data-state={checked ? (item.id === STEPS[index].id ? "right" : "wrong") : "idle"} whileDrag={{ scale: 1.03, boxShadow: "8px 8px 0 #17141F" }}>
            <GripVertical className="ix-grip" aria-hidden="true" />
            <span className="ix-step-n">{index + 1}</span>
            <span className="ix-step-text">{item.text}</span>
            <span className="ix-step-moves">
              <button type="button" className="dc-icon-button" aria-label={`Subir: ${item.text}`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp aria-hidden="true" /></button>
              <button type="button" className="dc-icon-button" aria-label={`Descer: ${item.text}`} disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown aria-hidden="true" /></button>
            </span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <div className="dc-row">
        <button type="button" className="primary-button" onClick={() => setChecked(true)}>Conferir ordem</button>
        <button type="button" className="text-button" onClick={() => { setItems(SHUFFLED); setChecked(false); }}><RotateCcw aria-hidden="true" />Embaralhar</button>
      </div>
      <p role="status" className="ix-feedback">{checked ? (correct ? "Perfeito: ler, calcular, aplicar, responder." : "Quase. Os passos em vermelho estão fora do lugar.") : " "}</p>
    </div>
  );
}

/* 8.4 — Tap a piece, then tap the box it belongs to; the piece flies there (shared layout). */
const PIECES = [
  { id: "p1", label: "0,5", kind: "decimal" }, { id: "p2", label: "1/4", kind: "fraction" }, { id: "p3", label: "30%", kind: "percent" },
  { id: "p4", label: "0,75", kind: "decimal" }, { id: "p5", label: "2/3", kind: "fraction" }, { id: "p6", label: "12%", kind: "percent" }
] as const;
const BINS = [["decimal", "Decimal"], ["fraction", "Fração"], ["percent", "Porcentagem"]] as const;
type Kind = (typeof PIECES)[number]["kind"];

export function ClassifyPieces() {
  const [placed, setPlaced] = useState<Record<string, Kind>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const loose = PIECES.filter((piece) => !placed[piece.id]);
  const allPlaced = loose.length === 0;
  function place(kind: Kind) { if (!picked) return; setPlaced((current) => ({ ...current, [picked]: kind })); setPicked(null); setChecked(false); }
  const chip = (piece: (typeof PIECES)[number], inBin: boolean) => (
    <motion.button layout layoutId={piece.id} key={piece.id} type="button" className="ix-piece" transition={SPRING}
      data-picked={picked === piece.id} data-state={checked && inBin ? (placed[piece.id] === piece.kind ? "right" : "wrong") : "idle"}
      aria-pressed={picked === piece.id} onClick={() => { if (inBin) { setPlaced((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== piece.id))); setChecked(false); } else setPicked(picked === piece.id ? null : piece.id); }}
      aria-label={inBin ? `${piece.label}, toque para devolver` : `Pegar ${piece.label}`}>
      {piece.label}
    </motion.button>
  );
  return (
    <LayoutGroup>
      <div className="ix-classify">
        <div className="ix-tray" aria-label="Peças">{loose.map((piece) => chip(piece, false))}{allPlaced ? <span className="dc-note">Todas no lugar.</span> : null}</div>
        <div className="ix-bins">
          {BINS.map(([kind, label]) => (
            <div key={kind} className="ix-bin" data-ready={picked !== null}>
              <button type="button" className="ix-bin-label" disabled={!picked} onClick={() => place(kind)}>{label}</button>
              <div className="ix-bin-body">{PIECES.filter((piece) => placed[piece.id] === kind).map((piece) => chip(piece, true))}</div>
            </div>
          ))}
        </div>
        <div className="dc-row">
          <button type="button" className="primary-button" disabled={!allPlaced} onClick={() => setChecked(true)}>Conferir</button>
          <button type="button" className="text-button" onClick={() => { setPlaced({}); setChecked(false); setPicked(null); }}><RotateCcw aria-hidden="true" />Recomeçar</button>
        </div>
        <p role="status" className="ix-feedback">{checked ? (PIECES.every((piece) => placed[piece.id] === piece.kind) ? "Tudo certo! Mesma ideia, três jeitos de escrever." : "Algumas peças estão na caixa errada (em vermelho).") : picked ? "Agora toque na caixa certa." : "Toque numa peça para pegar."}</p>
      </div>
    </LayoutGroup>
  );
}

/* 8.5 — Review deck: tap to flip, swipe right "Sei" / left "Rever" (buttons do the same). */
const CARDS = [
  { front: "O que é 1/2 em porcentagem?", back: "50%" },
  { front: "Fotossíntese produz…", back: "Glicose e oxigênio" },
  { front: "Sujeito de “Choveu muito.”", back: "Oração sem sujeito" },
  { front: "Linha imaginária de 0° de latitude", back: "Equador" }
];

export function ReviewDeck() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState({ known: 0, again: 0 });
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const knowOpacity = useTransform(x, [20, 120], [0, 1]);
  const againOpacity = useTransform(x, [-120, -20], [1, 0]);
  const done = index >= CARDS.length;
  function decide(known: boolean) {
    void animate(x, known ? 400 : -400, { duration: 0.25 }).then(() => {
      setTally((t) => (known ? { ...t, known: t.known + 1 } : { ...t, again: t.again + 1 }));
      setIndex((i) => i + 1); setFlipped(false); x.set(0);
    });
  }
  if (done) {
    return (
      <div className="ix-deck-done">
        <p><strong>{tally.known}</strong> você já sabe · <strong>{tally.again}</strong> voltam amanhã</p>
        <button type="button" className="secondary-button" onClick={() => { setIndex(0); setTally({ known: 0, again: 0 }); }}>Rever o baralho</button>
      </div>
    );
  }
  const card = CARDS[index];
  return (
    <div className="ix-deck">
      <div className="ix-deck-stage">
        {index + 1 < CARDS.length ? <div className="ix-card ix-card-under" aria-hidden="true" /> : null}
        <motion.div className="ix-card" style={{ x, rotate }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.9}
          onDragEnd={(_, info) => { if (info.offset.x > 120) decide(true); else if (info.offset.x < -120) decide(false); }}>
          <motion.span className="ix-stamp" data-kind="know" style={{ opacity: knowOpacity }} aria-hidden="true">Sei</motion.span>
          <motion.span className="ix-stamp" data-kind="again" style={{ opacity: againOpacity }} aria-hidden="true">Rever</motion.span>
          <motion.button type="button" className="ix-card-face" onClick={() => setFlipped((f) => !f)} animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.4 }} aria-label={flipped ? `Resposta: ${card.back}. Toque para ver a pergunta.` : `${card.front}. Toque para ver a resposta.`}>
            <span className="ix-face" data-side="front"><small>Cartão {index + 1} de {CARDS.length}</small>{card.front}</span>
            <span className="ix-face" data-side="back"><small>Resposta</small>{card.back}</span>
          </motion.button>
        </motion.div>
      </div>
      <div className="ix-deck-actions">
        <button type="button" className="secondary-button" onClick={() => decide(false)}><Undo2 aria-hidden="true" />Rever</button>
        <button type="button" className="primary-button" onClick={() => decide(true)}><Check aria-hidden="true" />Sei</button>
      </div>
    </div>
  );
}

/* 8.6 — Confidence before checking: calibrates the feedback (metacognition). */
const LEVELS = [["guess", "Chutei"], ["think", "Acho que sim"], ["sure", "Tenho certeza"]] as const;
type Level = (typeof LEVELS)[number][0];

export function ConfidenceCheck() {
  const [choice, setChoice] = useState<number | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = choice === 1;
  const message = !checked || level === null ? null
    : correct && level === "sure" ? "Certo e com certeza: conceito firme."
    : correct && level === "guess" ? "Acertou no chute. Ele volta em breve para confirmar."
    : correct ? "Certo! Mais um passo para a certeza."
    : level === "sure" ? "Ponto cego encontrado: você tinha certeza, então isso vai para a revisão prioritária. Ótimo achado."
    : "Ainda não, e tudo bem: você já desconfiava. Vamos rever.";
  return (
    <div className="ix-confidence">
      <h4>Qual é maior: 0,5 ou 0,45?</h4>
      <div className="dc-row" role="radiogroup" aria-label="Resposta">
        {["0,45", "0,5", "São iguais"].map((label, i) => (
          <button key={label} type="button" role="radio" aria-checked={choice === i} className="dc-pill" data-on={choice === i} onClick={() => { setChoice(i); setChecked(false); }}>{label}</button>
        ))}
      </div>
      <p className="type-meta">Quanto você tem certeza?</p>
      <LayoutGroup>
        <div className="ix-levels" role="radiogroup" aria-label="Confiança">
          {LEVELS.map(([key, label]) => (
            <button key={key} type="button" role="radio" aria-checked={level === key} className="ix-level" onClick={() => { setLevel(key); setChecked(false); }}>
              {level === key ? <motion.span layoutId="ix-level-pill" className="ix-level-pill" transition={SPRING} /> : null}
              <span className="ix-level-text">{label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <button type="button" className="primary-button" disabled={choice === null || level === null} onClick={() => setChecked(true)}>Conferir</button>
      <AnimatePresence>
        {message ? (
          <motion.p key={message} className="ix-calibrate" data-result={correct ? "correct" : "wrong"} role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
            {correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
