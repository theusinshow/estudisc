"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLessonResume } from "./resume-provider";
import { restoredStep } from "./resume-contracts";
import { playStepTransition } from "@/components/motion/step-transition";
import { ATTEMPT_RECORDED_EVENT, type AttemptRecordedDetail } from "@/features/progress/live-progress-summary";
import { MathText } from "@/components/ui/paragraphs";
import { ReadAloudButton } from "@/features/study-tools/read-aloud";
import { FocusMode } from "@/features/study-tools/focus-mode";

/** Questions answered in this visit whose latest answer is still wrong; the server keeps the durable record in /review. */
function useOpenMistakes() {
  const [latest, setLatest] = useState<ReadonlyMap<string, AttemptRecordedDetail>>(new Map());
  useEffect(() => {
    const record = (event: Event) => {
      const detail = (event as CustomEvent<AttemptRecordedDetail | undefined>).detail;
      if (detail?.questionId) setLatest(current => new Map(current).set(detail.questionId, detail));
    };
    window.addEventListener(ATTEMPT_RECORDED_EVENT, record);
    return () => window.removeEventListener(ATTEMPT_RECORDED_EVENT, record);
  }, []);
  return [...latest.values()].filter(item => !item.correct);
}
// Formulas are never cut in half.
const shortStem = (stem: string) => { const text = stem.replace(/\s+/g, " ").trim(); return text.length > 90 && !text.includes("$") ? `${text.slice(0, 87)}…` : text; };

export type LessonStep = { id: string; kind: "intro" | "concept" | "example" | "warning" | "summary" | "check" | "practice" | "exit" | "interaction" | "reading" | "figure" | "prediction"; label: string; node: ReactNode };
export type LessonCompletion = Readonly<{ trackHref: string; nextLesson?: Readonly<{ href: string; title: string }> }>;

const DONE_HASH = "#concluida";
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
// The step lives in the URL hash so a reload (or a shared link) reopens the same step.
function stepFromHash(hash: string, total: number) {
  if (hash === DONE_HASH) return total;
  const step = Number(/^#passo-(\d+)$/.exec(hash)?.[1]);
  return Number.isInteger(step) && step >= 1 && step <= total ? step - 1 : 0;
}

/** Shows one step at a time. Every step stays mounted, so answers and feedback survive navigation. */
export function LessonStepper({ steps, completion }: Readonly<{ steps: LessonStep[]; completion?: LessonCompletion }>) {
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const resume = useLessonResume();
  const openMistakes = useOpenMistakes();
  const restored = restoredStep(steps.map(step => step.id), resume?.data.stepId ?? null, resume?.data.completed ?? false);
  const [index, setIndex] = useState(() => restored.index);
  const [showAll, setShowAll] = useState(() => resume?.data.showAll ?? false);
  const top = useRef<HTMLDivElement>(null);
  // Only a standalone lesson owns the URL; a study session renders several steppers on one page.
  const ownsUrl = Boolean(completion) && !resume;
  // Read after hydration: the server always renders step 1, so the hidden attributes match.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL, not derived state
  useEffect(() => { if (ownsUrl && window.location.hash) setIndex(stepFromHash(window.location.hash, steps.length)); }, [ownsUrl, steps.length]);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const go = (next: number) => {
    const direction = next >= index ? 1 : -1;
    setIndex(next);
    // The target step is mounted (hidden); reveal it, then slide it in from the side of travel.
    requestAnimationFrame(() => playStepTransition(next >= steps.length ? top.current?.querySelector<HTMLElement>(".lesson-complete") : stepRefs.current[next], direction));
    resume?.update({ stepId: steps[next]?.id ?? null, completed: next >= steps.length });
    if (ownsUrl) window.history.replaceState(null, "", next >= steps.length ? DONE_HASH : `#passo-${next + 1}`);
    // Scroll the window (not an inner container) only when the step start left the viewport.
    const box = top.current?.getBoundingClientRect();
    if (box && box.top < 0) window.scrollTo({ top: window.scrollY + box.top - 96 });
  };
  const done = index >= steps.length;
  const current = steps[index];
  const last = index === steps.length - 1;

  return (
    <div className="lesson-stepper" ref={top} data-mode={showAll ? "all" : "step"}>
      {/* Notebook margin (desktop only): every part of the lesson, free navigation, current step marked. */}
      {steps.length > 1 && <ol className="stepper-outline" aria-label="Partes da aula">
        {steps.map((step, position) => <li key={step.id}><button type="button" disabled={!ready} aria-current={!done && position === index ? "step" : undefined} data-done={position < index || undefined} onClick={() => go(position)}><span>{String(position + 1).padStart(2, "0")}</span><span>{step.label}</span></button></li>)}
      </ol>}
      <div className="stepper-main">
      {!ready && <p role="status">Carregando controles da aula…</p>}
      {restored.stale && <p role="status">O passo salvo não está disponível. Retomamos o primeiro passo desta versão.</p>}
      <div className="stepper-head">
        {showAll ? <span className="stepper-count">Aula inteira · {steps.length} partes</span> : <span className="stepper-count" aria-live="polite">{done ? <strong>Aula concluída</strong> : <>Passo {index + 1} de {steps.length} · <strong>{current?.label}</strong></>}</span>}
        <button type="button" className="stepper-toggle" disabled={!ready} onClick={() => { setShowAll(!showAll); resume?.update({ showAll: !showAll }); }} aria-pressed={showAll}>{showAll ? "Um passo por vez" : "Ver tudo"}</button>
        <FocusMode />
        {!showAll && !done && !["check", "practice", "exit"].includes(steps[index]?.kind ?? "") && <ReadAloudButton label="Ouvir este passo" getText={() => stepRefs.current[index]?.innerText ?? ""} />}
        {!showAll && <progress className="stepper-bar" value={Math.min(index + 1, steps.length)} max={steps.length} aria-label="Progresso da aula" />}
      </div>
      {steps.map((step, position) => (
        <section className="lesson-step" data-kind={step.kind} key={step.id} hidden={!showAll && position !== index} aria-label={step.label} ref={element => { stepRefs.current[position] = element; }}>
          {step.node}
        </section>
      ))}
      {!showAll && done && (
        <section className="lesson-step lesson-complete" aria-labelledby="lesson-complete-title">
          <h2 id="lesson-complete-title">Você chegou ao fim da aula</h2>
          {openMistakes.length ? (
            <div className="lesson-mistakes">
              <p><strong>{openMistakes.length === 1 ? "1 questão ficou com erro" : `${openMistakes.length} questões ficaram com erro`} nesta aula.</strong> Revisar agora, com a aula fresca, ajuda a fixar o que faltou.</p>
              <ul>{openMistakes.map(item => <li key={item.questionId}><MathText text={shortStem(item.stem)} /></li>)}</ul>
              <Link className="secondary-button" href="/review">Revisar meus erros</Link>
            </div>
          ) : <p>Você aprende de verdade quando acerta sem ajuda e volta a revisar nos próximos dias.</p>}
          <nav className="lesson-complete-actions" aria-label="Depois da aula">
            {completion?.nextLesson ? (
              <Link className="primary-button" href={completion.nextLesson.href}>Próxima aula: {completion.nextLesson.title}<ArrowRight aria-hidden="true" /></Link>
            ) : (
              <Link className="primary-button" href={completion?.trackHref ?? "/"}>Voltar à trilha<ArrowRight aria-hidden="true" /></Link>
            )}
            {completion?.nextLesson && <Link href={completion.trackHref}>Ver a trilha</Link>}
            <Link href="/">Ir para Hoje</Link>
          </nav>
        </section>
      )}
      {!showAll && !done && (
        <nav className="stepper-nav" aria-label="Navegação da aula">
          <button type="button" onClick={() => go(index - 1)} disabled={!ready || index === 0}><ArrowLeft aria-hidden="true" />Voltar</button>
          {last && !completion ? <button type="button" className="primary-button" disabled>Fim desta aula</button> : <button type="button" className="primary-button" disabled={!ready} onClick={() => go(index + 1)}>{last ? "Concluir aula" : "Próximo"}<ArrowRight aria-hidden="true" /></button>}
        </nav>
      )}
      {!showAll && done && (
        <nav className="stepper-nav" aria-label="Navegação da aula">
          <button type="button" disabled={!ready} onClick={() => go(steps.length - 1)}><ArrowLeft aria-hidden="true" />Rever último passo</button>
        </nav>
      )}
      </div>
    </div>
  );
}
