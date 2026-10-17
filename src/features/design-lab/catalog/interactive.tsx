"use client";

import { ArrowRight, Check, ChevronsRight, Clock, Flame, Lightbulb, Target, Volume2, VolumeX, X } from "lucide-react";
import { animate, AnimatePresence, motion, MotionConfig, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { playFeedback, type FeedbackSound } from "./sound";

/* Motion scale (documented in the catalog): micro 100–120ms, feedback 220ms, celebration only at the end. */
const MICRO = { type: "spring", stiffness: 700, damping: 30 } as const;
const FEEDBACK = { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const;

const QUESTIONS = [
  { stem: "Quanto é 10% de 250?", hint: "10% é o mesmo que dividir por 10.", choices: ["2,5", "25", "250", "2500"], answer: 1, why: "250 ÷ 10 = 25." },
  { stem: "29% dos bilhetes pediram revisão. O que isso significa?", hint: "Porcentagem compara uma parte com 100.", choices: ["29 bilhetes no total", "29 em cada 100 bilhetes", "29 vezes o total", "A parte que não pediu"], answer: 1, why: "“Por cento” quer dizer “a cada 100”." },
  { stem: "Um tênis de R$ 200 teve 15% de desconto. Quanto ficou?", hint: "Calcule 15% de 200 e tire do preço.", choices: ["R$ 185", "R$ 170", "R$ 30", "R$ 215"], answer: 1, why: "15% de 200 = 30; 200 − 30 = 170." }
] as const;
const LETTERS = ["A", "B", "C", "D"];

function useSound(enabled: boolean) {
  return (kind: FeedbackSound) => { if (enabled) playFeedback(kind); };
}

function SoundToggle({ on, onChange }: Readonly<{ on: boolean; onChange: (value: boolean) => void }>) {
  return (
    <button type="button" className="dc-sound" aria-pressed={on} onClick={() => onChange(!on)}>
      {on ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}{on ? "Som ligado" : "Som desligado"}
    </button>
  );
}

function CountUp({ to, suffix = "" }: Readonly<{ to: number; suffix?: string }>) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) { node.textContent = `${to}${suffix}`; return; }
    const controls = animate(0, to, { duration: 0.9, ease: "easeOut", onUpdate: (value) => { node.textContent = `${Math.round(value)}${suffix}`; } });
    return () => controls.stop();
  }, [to, suffix, reduce]);
  return <span ref={ref} aria-label={`${to}${suffix}`}>{`${to}${suffix}`}</span>;
}

function Confetti() {
  return <span className="dc-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} data-i={index} />)}</span>;
}

const noopSubscribe = () => () => {};
/** Motion writes inline styles; rendering only after hydration keeps them out of the server HTML (strict CSP). */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** 7.1 — A full question loop: hint before answering, 3D keys, rising result banner, segmented progress that always advances. */
function LessonDemo() {
  const [sound, setSound] = useState(false);
  const play = useSound(sound);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const done = index >= QUESTIONS.length;
  const question = QUESTIONS[Math.min(index, QUESTIONS.length - 1)];
  const correct = checked && selected === question.answer;

  function check() {
    if (selected === null) return;
    setChecked(true);
    const ok = selected === question.answer;
    setResults((previous) => [...previous, ok]);
    play(ok ? "correct" : "wrong");
  }
  function next() {
    setIndex((value) => value + 1); setSelected(null); setChecked(false); setHint(false);
    if (index + 1 >= QUESTIONS.length && results.every(Boolean)) play("celebrate");
  }
  function restart() { setIndex(0); setSelected(null); setChecked(false); setHint(false); setResults([]); }

  return (
    <div className="dc-lesson">
      <div className="dc-lesson-top">
        <ol className="dc-segments" aria-label={`Progresso da aula: ${results.length} de ${QUESTIONS.length}`}>
          {QUESTIONS.map((_, i) => <li key={i} data-state={results[i] === undefined ? (i === index ? "current" : "todo") : results[i] ? "right" : "retry"} />)}
        </ol>
        <SoundToggle on={sound} onChange={setSound} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div key="summary" className="dc-summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={FEEDBACK}>
            <div className="dc-celebrate">{results.every(Boolean) ? <Confetti /> : null}<h4>{results.every(Boolean) ? "Aula perfeita!" : "Aula concluída"}</h4></div>
            <motion.ul className="dc-stats" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
              {[[Target, results.filter(Boolean).length, `/${QUESTIONS.length}`, "acertos"], [Clock, 4, " min", "de estudo"], [Flame, 5, "", "dias nesta semana"]].map(([Icon, value, suffix, label]) => {
                const I = Icon as typeof Target;
                return (
                  <motion.li key={label as string} className="dc-stat" variants={{ hidden: { opacity: 0, y: 12, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: MICRO } }}>
                    <I aria-hidden="true" /><strong><CountUp to={value as number} suffix={suffix as string} /></strong><small>{label as string}</small>
                  </motion.li>
                );
              })}
            </motion.ul>
            {!results.every(Boolean) ? <p className="dc-note">As questões que você errou voltam na revisão de amanhã.</p> : null}
            <button type="button" className="secondary-button" onClick={restart}>Fazer de novo</button>
          </motion.div>
        ) : (
          <motion.div key={index} className="dc-question" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={FEEDBACK}>
            <p className="type-meta">Questão {index + 1} de {QUESTIONS.length} · Matemática</p>
            <h4>{question.stem}</h4>
            <AnimatePresence initial={false}>
              {hint && !checked ? (
                <motion.aside key="hint" className="dc-hint dc-hint-inline" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={FEEDBACK}>
                  <span className="dc-hint-icon"><Lightbulb aria-hidden="true" /></span><p>{question.hint}</p>
                </motion.aside>
              ) : null}
            </AnimatePresence>
            <ul className="dc-answers" data-variant="key" role="radiogroup" aria-label="Alternativas">
              {question.choices.map((choice, i) => {
                const state = checked ? (i === question.answer ? "correct" : i === selected ? "wrong" : "idle") : i === selected ? "selected" : "idle";
                return (
                  <motion.li key={choice} className="dc-answer" data-state={state} role="radio" aria-checked={i === selected} tabIndex={checked ? -1 : 0} aria-disabled={checked}
                    whileTap={checked ? undefined : { y: 4 }} transition={MICRO}
                    onClick={() => { if (!checked) { setSelected(i); play("tap"); } }}
                    onKeyDown={(event) => { if (!checked && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelected(i); } }}>
                    <span className="dc-letter" aria-hidden="true">{LETTERS[i]}</span><span className="dc-answer-text">{choice}</span>
                    {state === "correct" ? <Check className="dc-answer-icon" aria-hidden="true" /> : null}
                    {state === "wrong" ? <X className="dc-answer-icon" aria-hidden="true" /> : null}
                  </motion.li>
                );
              })}
            </ul>
            {!checked ? (
              <div className="dc-row">
                <button type="button" className="primary-button" disabled={selected === null} onClick={check}>Conferir</button>
                {!hint ? <button type="button" className="text-button" onClick={() => setHint(true)}><Lightbulb aria-hidden="true" />Ver dica</button> : null}
              </div>
            ) : null}
            <div aria-live="polite">
              <AnimatePresence>
                {checked ? (
                  <motion.section key="banner" className="dc-banner" data-result={correct ? "correct" : "wrong"} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={FEEDBACK}>
                    <motion.span className="dc-banner-icon" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.55, duration: 0.45 }}>{correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</motion.span>
                    <div className="dc-banner-copy">
                      <strong>{correct ? "Certo!" : `Quase… Resposta: ${LETTERS[question.answer]}`}</strong>
                      <p>{question.why}</p>
                    </div>
                    <button type="button" className="dc-banner-button" onClick={next}>Continuar <ArrowRight aria-hidden="true" /></button>
                  </motion.section>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 7.2 — Weekly study days with a built-in day off; never threatens loss. */
function StreakWeek() {
  const days = [["S", "done"], ["T", "done"], ["Q", "off"], ["Q", "done"], ["S", "done"], ["S", "today"], ["D", "todo"]] as const;
  return (
    <div className="dc-streak">
      <div className="dc-streak-head"><span className="dc-badge-icon" data-subject="mathematics"><Flame aria-hidden="true" /></span><div><strong>4 dias nesta semana</strong><small>Meta: 5 dias · você ainda tem 1 dia de folga</small></div></div>
      <ol className="dc-week" aria-label="Dias estudados nesta semana">
        {days.map(([label, state], i) => <li key={i} data-state={state}><span>{state === "done" ? <Check aria-hidden="true" /> : state === "off" ? "☾" : ""}</span>{label}<span className="visually-hidden">{state === "done" ? " estudado" : state === "off" ? " folga" : state === "today" ? " hoje" : ""}</span></li>)}
      </ol>
    </div>
  );
}

/** 7.3 — Progress ring (adapted from Magic UI's MIT circular progress, rewritten with Motion pathLength). */
function ProgressRing({ value, label, subject }: Readonly<{ value: number; label: string; subject: string }>) {
  const reduce = useReducedMotion();
  const length = useMotionValue(reduce ? value / 100 : 0);
  useEffect(() => {
    const controls = animate(length, value / 100, { duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [length, value, reduce]);
  return (
    <figure className="dc-ring" data-subject={subject}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="47" className="dc-ring-edge" />
        <circle cx="50" cy="50" r="40" className="dc-ring-track" />
        <circle cx="50" cy="50" r="33" className="dc-ring-edge" />
        <motion.circle cx="50" cy="50" r="40" className="dc-ring-fill" style={{ pathLength: length }} />
      </svg>
      <figcaption><strong><CountUp to={value} suffix="%" /></strong><small>{label}</small></figcaption>
    </figure>
  );
}

/** 7.4 — Stacked toasts (pattern inspired by Bencho's Toast stack; own code). */
function ToastStack() {
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const counter = useRef(0);
  const messages = ["Progresso salvo.", "Nova conquista: 5 dias!", "Revisão de amanhã: 3 questões."];
  function push() {
    const id = ++counter.current;
    setToasts((list) => [...list.slice(-2), { id, text: messages[(id - 1) % messages.length] }]);
    window.setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), 3500);
  }
  return (
    <div className="dc-stack">
      <button type="button" className="secondary-button" onClick={push}>Mostrar aviso</button>
      <ol className="dc-toasts" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.li key={toast.id} layout className="dc-toast" initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }} transition={MICRO}>
              <Check aria-hidden="true" /><span>{toast.text}</span>
              <button type="button" className="dc-icon-button" aria-label="Fechar aviso" onClick={() => setToasts((list) => list.filter((t) => t.id !== toast.id))}><X aria-hidden="true" /></button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}

/** 7.5 — Sticker card that tilts toward the pointer (inspired by Bencho's Tilt card; own code). */
function TiltCard() {
  const reduce = useReducedMotion();
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 20 });
  return (
    <motion.article className="dc-card dc-tilt" data-subject="science" tabIndex={0}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 600 }}
      onPointerMove={(event) => { const r = event.currentTarget.getBoundingClientRect(); x.set((event.clientX - r.left) / r.width - 0.5); y.set((event.clientY - r.top) / r.height - 0.5); }}
      onPointerLeave={() => { x.set(0); y.set(0); }}>
      <span className="dc-sticker">Ciências</span><h4>Movimento</h4><p className="dc-card-meta">Aula 10 de 12</p>
    </motion.article>
  );
}

/** 7.6 — Slide to submit a mock exam (inspired by Bencho's Slide to confirm); the knob is also a button for keyboard users. */
function SlideToSubmit() {
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [done, setDone] = useState(false);
  const fill = useTransform(x, (value) => `${value + 56}px`);
  function finish() { setDone(true); animate(x, (track.current?.clientWidth ?? 300) - 62, MICRO); }
  return (
    <div className="dc-stack">
    <div className="dc-slide" ref={track} data-done={done}>
      <motion.span className="dc-slide-fill" style={{ width: fill }} aria-hidden="true" />
      <span className="dc-slide-label">{done ? "Simulado entregue!" : "Deslize para entregar"}</span>
      <motion.button type="button" className="dc-slide-knob" aria-label={done ? "Entregue" : "Entregar simulado"} disabled={done}
        drag={done ? false : "x"} dragConstraints={track} dragElastic={0} dragMomentum={false} style={{ x }}
        onDragEnd={() => { const max = (track.current?.clientWidth ?? 300) - 62; if (x.get() > max * 0.8) finish(); else animate(x, 0, MICRO); }}
        onClick={() => { if (!done) finish(); }}>
        {done ? <Check aria-hidden="true" /> : <ChevronsRight aria-hidden="true" />}
      </motion.button>
    </div>
      {done ? <button type="button" className="text-button" onClick={() => { setDone(false); animate(x, 0, MICRO); }}>Desfazer</button> : null}
    </div>
  );
}

export function InteractiveBlock() {
  const hydrated = useHydrated();
  if (!hydrated) return <section className="dc-block" id="interacoes" aria-busy="true"><h2 className="type-title"><span className="dc-block-number">7</span>Interações ao vivo</h2><p className="dc-note">Carregando…</p></section>;
  return (
    <MotionConfig reducedMotion="user">
      <section className="dc-block" id="interacoes" aria-labelledby="interacoes-title">
        <h2 id="interacoes-title" className="type-title"><span className="dc-block-number">7</span>Interações ao vivo</h2>
        <p className="dc-note">Tudo funciona de verdade. Escala de movimento: micro (toque, ~100ms), retorno (faixa, ~220ms), comemoração só no fim da aula. Sons desligados por padrão.</p>
        <div className="dc-grid">
          <article className="dc-item dc-item-wide" id="item-7.1"><header className="dc-item-head"><span className="dc-code">7.1</span><h3>Questão completa</h3></header><p className="dc-note">Dica antes de responder, sem penalidade · barra avança no acerto e no erro · erro volta na revisão.</p><LessonDemo /></article>
          <article className="dc-item" id="item-7.2"><header className="dc-item-head"><span className="dc-code">7.2</span><h3>Sequência sem ameaça</h3></header><p className="dc-note">Conta dias por semana, com folga embutida. Nunca “você vai perder tudo”.</p><StreakWeek /></article>
          <article className="dc-item" id="item-7.3"><header className="dc-item-head"><span className="dc-code">7.3</span><h3>Anel de domínio por matéria</h3></header><p className="dc-note">Domínio vem de evidência real dos conceitos, não de aulas abertas.</p><div className="dc-rings"><ProgressRing value={62} label="Matemática" subject="mathematics" /><ProgressRing value={38} label="Português" subject="portuguese" /></div></article>
          <article className="dc-item" id="item-7.4"><header className="dc-item-head"><span className="dc-code">7.4</span><h3>Avisos empilhados</h3></header><p className="dc-note">No máximo 3; somem sozinhos; podem ser fechados.</p><ToastStack /></article>
          <article className="dc-item" id="item-7.5"><header className="dc-item-head"><span className="dc-code">7.5</span><h3>Card que inclina</h3></header><p className="dc-note">Passe o mouse ou o dedo. Desligado com “reduzir movimento”.</p><TiltCard /></article>
          <article className="dc-item" id="item-7.6"><header className="dc-item-head"><span className="dc-code">7.6</span><h3>Deslize para entregar</h3></header><p className="dc-note">Evita entregar o simulado sem querer. No teclado: Tab até o botão e Enter.</p><SlideToSubmit /></article>
        </div>
      </section>
    </MotionConfig>
  );
}
