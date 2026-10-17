"use client";

import { ArrowRight, Check, Pause, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { animate, AnimatePresence, LayoutGroup, motion, useMotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";

const SPRING = { type: "spring", stiffness: 420, damping: 30 } as const;

/* 8.9 — Concept map: mastering a concept draws its link and lights the node. */
const NODES = [
  { id: "frac", label: "Frações", x: 60, y: 60 },
  { id: "dec", label: "Decimais", x: 220, y: 40 },
  { id: "pct", label: "Porcentagem", x: 150, y: 150 },
  { id: "desc", label: "Descontos", x: 300, y: 160 },
  { id: "juros", label: "Juros", x: 240, y: 250 }
];
const EDGES = [["frac", "pct"], ["dec", "pct"], ["pct", "desc"], ["desc", "juros"]] as const;

export function ConceptMap() {
  const [mastered, setMastered] = useState(1);
  const pos = Object.fromEntries(NODES.map((n) => [n.id, n]));
  const isOn = (id: string) => NODES.findIndex((n) => n.id === id) < mastered;
  return (
    <div className="ix-map">
      <svg viewBox="0 0 360 300" className="ix-map-svg" role="img" aria-label={`Mapa de conceitos: ${mastered} de ${NODES.length} dominados`}>
        {EDGES.map(([a, b]) => (
          <g key={`${a}-${b}`}>
            <line x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} className="ix-edge-base" />
            <motion.line x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} className="ix-edge-on" initial={false} animate={{ pathLength: isOn(a) && isOn(b) ? 1 : 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
          </g>
        ))}
        {NODES.map((n) => (
          <g key={n.id}>
            <motion.circle cx={n.x} cy={n.y} r={22} className="ix-node" data-on={isOn(n.id)} initial={false} animate={{ scale: isOn(n.id) ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.45 }} />
            <text x={n.x} y={n.y + 40} textAnchor="middle" className="ix-node-label">{n.label}</text>
          </g>
        ))}
      </svg>
      <div className="dc-row">
        <button type="button" className="primary-button" disabled={mastered >= NODES.length} onClick={() => setMastered((m) => m + 1)}><Sparkles aria-hidden="true" />Dominar o próximo</button>
        <button type="button" className="text-button" onClick={() => setMastered(1)}><RotateCcw aria-hidden="true" />Recomeçar</button>
      </div>
    </div>
  );
}

/* 8.10 — The sticker card morphs into the lesson header (shared layout), then back. */
const LESSONS = [
  { id: "mat", subject: "mathematics", name: "Matemática", title: "Porcentagem", meta: "Aula 5 de 12 · 8 min" },
  { id: "cie", subject: "science", name: "Ciências", title: "Movimento", meta: "Aula 10 de 12 · 6 min" }
] as const;

export function CardToLesson() {
  const [open, setOpen] = useState<string | null>(null);
  const lesson = LESSONS.find((l) => l.id === open);
  return (
    <LayoutGroup>
      <div className="ix-morph">
        <div className="ix-morph-grid">
          {LESSONS.map((l) => (
            <motion.button key={l.id} layoutId={`card-${l.id}`} type="button" className="ix-morph-card" data-subject={l.subject} onClick={() => setOpen(l.id)} transition={SPRING} aria-label={`Abrir aula ${l.title}`}>
              <motion.span layoutId={`sticker-${l.id}`} className="dc-sticker">{l.name}</motion.span>
              <motion.strong layoutId={`title-${l.id}`}>{l.title}</motion.strong>
              <small>{l.meta}</small>
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {lesson ? (
            <motion.div key="lesson" layoutId={`card-${lesson.id}`} className="ix-morph-open" data-subject={lesson.subject} transition={SPRING} role="dialog" aria-label={`Aula ${lesson.title}`}>
              <button type="button" className="dc-icon-button ix-morph-close" aria-label="Fechar aula" onClick={() => setOpen(null)}><X aria-hidden="true" /></button>
              <motion.span layoutId={`sticker-${lesson.id}`} className="dc-sticker">{lesson.name}</motion.span>
              <motion.strong layoutId={`title-${lesson.id}`} className="ix-morph-title">{lesson.title}</motion.strong>
              <motion.div className="ix-morph-body" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }} exit={{ opacity: 0 }}>
                <p>Porcentagem é uma forma de comparar uma parte com 100. Nesta aula você vai calcular descontos.</p>
                <button type="button" className="primary-button">Começar <ArrowRight aria-hidden="true" /></button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

/* 8.11 — Daily goal tower: each task done drops a block onto the tower. */
const TASKS = ["Revisar 3 questões", "Aula de Porcentagem", "1 questão de Português", "Mapa de Ciências"];
const TOWER = ["mathematics", "portuguese", "science", "history-geography"];

export function GoalTower() {
  const [done, setDone] = useState<boolean[]>([true, false, false, false]);
  const count = done.filter(Boolean).length;
  return (
    <div className="ix-tower-wrap">
      <ul className="ix-tasks">
        {TASKS.map((task, i) => (
          <li key={task}>
            <label className="dc-option"><input type="checkbox" checked={done[i]} onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} /><span>{task}</span></label>
          </li>
        ))}
      </ul>
      <div className="ix-tower" aria-label={`Meta do dia: ${count} de ${TASKS.length}`}>
        <AnimatePresence>
          {done.map((isDone, i) => (isDone ? (
            <motion.span key={i} className="ix-block" data-subject={TOWER[i]} initial={{ y: -140, rotate: -8, opacity: 0 }} animate={{ y: 0, rotate: i % 2 ? 2 : -2, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 18 }} />
          ) : null))}
        </AnimatePresence>
        <span className="ix-tower-base">{count === TASKS.length ? "Meta feita!" : `${count}/${TASKS.length}`}</span>
      </div>
    </div>
  );
}

/* 8.12 — Focus mode: session ring (demo runs 25 s for 25 min) and a breathing break. */
export function FocusTimer() {
  const total = 25;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const progress = useMotionValue(1);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    timer.current = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [running]);
  useEffect(() => { void animate(progress, left / total, { duration: 0.5 }); }, [left, progress]);
  const finished = left === 0;
  return (
    <div className="ix-focus">
      <div className="ix-focus-ring" data-break={finished}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="50" className="ix-focus-track" />
          <motion.circle cx="60" cy="60" r="50" className="ix-focus-fill" style={{ pathLength: progress }} />
        </svg>
        <div className="ix-focus-center" aria-live="polite">
          {finished ? <motion.span className="ix-breathe" animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>Respire</motion.span>
            : <><strong>{String(left).padStart(2, "0")}:00</strong><small>{running ? "focado" : "pausado"}</small></>}
        </div>
      </div>
      <p className="dc-note">{finished ? "Pausa de 5 minutos. Inspire quando o círculo crescer." : "Demonstração acelerada: 1 segundo = 1 minuto."}</p>
      <div className="dc-row">
        <button type="button" className="primary-button" disabled={finished} onClick={() => setRunning((r) => !r)}>{running ? <><Pause aria-hidden="true" />Pausar</> : <><Play aria-hidden="true" />Começar</>}</button>
        <button type="button" className="text-button" onClick={() => { setRunning(false); setLeft(total); }}><RotateCcw aria-hidden="true" />Reiniciar</button>
      </div>
    </div>
  );
}

/* 8.13 — Exam countdown with flipping digits. */
const EXAM = new Date("2026-11-29T08:00:00-03:00").getTime();
function parts(now: number) {
  const s = Math.max(0, Math.floor((EXAM - now) / 1000));
  return [["dias", Math.floor(s / 86400)], ["horas", Math.floor((s % 86400) / 3600)], ["min", Math.floor((s % 3600) / 60)], ["seg", s % 60]] as const;
}

function Flip({ value }: Readonly<{ value: number }>) {
  const text = String(value).padStart(2, "0");
  return (
    <span className="ix-flip">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={text} initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: 90, opacity: 0 }} transition={{ duration: 0.3 }}>{text}</motion.span>
      </AnimatePresence>
    </span>
  );
}

export function ExamCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  const p = parts(now);
  return (
    <div className="ix-countdown" role="timer" aria-label={`Faltam ${p[0][1]} dias para a prova`}>
      {p.map(([label, value]) => <div key={label} className="ix-count-cell"><Flip value={value} /><small>{label}</small></div>)}
      <p className="ix-count-note"><Check aria-hidden="true" />Prova do IFSC · 29/11/2026</p>
    </div>
  );
}
