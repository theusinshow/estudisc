"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLessonResume } from "./resume-provider";
import { restoredStep } from "./resume-contracts";

export type LessonStep = { id: string; kind: "intro" | "concept" | "example" | "warning" | "summary" | "check" | "practice" | "exit" | "interaction" | "figure" | "prediction"; label: string; node: ReactNode };
export type LessonCompletion = Readonly<{ trackHref: string; nextLesson?: Readonly<{ href: string; title: string }> }>;

const DONE_HASH = "#concluida";
// The step lives in the URL hash so a reload (or a shared link) reopens the same step.
function stepFromHash(hash: string, total: number) {
  if (hash === DONE_HASH) return total;
  const step = Number(/^#passo-(\d+)$/.exec(hash)?.[1]);
  return Number.isInteger(step) && step >= 1 && step <= total ? step - 1 : 0;
}

/** Shows one step at a time. Every step stays mounted, so answers and feedback survive navigation. */
export function LessonStepper({ steps, completion }: Readonly<{ steps: LessonStep[]; completion?: LessonCompletion }>) {
  const resume = useLessonResume();
  const restored = restoredStep(steps.map(step => step.id), resume?.data.stepId ?? null, resume?.data.completed ?? false);
  const [index, setIndex] = useState(() => restored.index);
  const [showAll, setShowAll] = useState(() => resume?.data.showAll ?? false);
  const top = useRef<HTMLDivElement>(null);
  // Only a standalone lesson owns the URL; a study session renders several steppers on one page.
  const ownsUrl = Boolean(completion) && !resume;
  // Read after hydration: the server always renders step 1, so the hidden attributes match.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL, not derived state
  useEffect(() => { if (ownsUrl && window.location.hash) setIndex(stepFromHash(window.location.hash, steps.length)); }, [ownsUrl, steps.length]);
  const go = (next: number) => {
    setIndex(next);
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
      {restored.stale && <p role="status">O passo salvo não está disponível. Retomamos o primeiro passo desta versão.</p>}
      <div className="stepper-head">
        {showAll ? <span className="stepper-count">Aula inteira · {steps.length} partes</span> : <span className="stepper-count" aria-live="polite">{done ? <strong>Aula concluída</strong> : <>Passo {index + 1} de {steps.length} · <strong>{current?.label}</strong></>}</span>}
        <button type="button" className="stepper-toggle" onClick={() => { setShowAll(!showAll); resume?.update({ showAll: !showAll }); }} aria-pressed={showAll}>{showAll ? "Um passo por vez" : "Ver tudo"}</button>
        {!showAll && <progress className="stepper-bar" value={Math.min(index + 1, steps.length)} max={steps.length} aria-label="Progresso da aula" />}
      </div>
      {steps.map((step, position) => (
        <section className="lesson-step" data-kind={step.kind} key={step.id} hidden={!showAll && position !== index} aria-label={step.label}>
          {step.node}
        </section>
      ))}
      {!showAll && done && (
        <section className="lesson-step lesson-complete" aria-labelledby="lesson-complete-title">
          <h2 id="lesson-complete-title">Você chegou ao fim da aula</h2>
          <p>O domínio de cada conceito vem das respostas enviadas às questões, da prática sem ajuda e das revisões ao longo do tempo.</p>
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
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0}><ArrowLeft aria-hidden="true" />Voltar</button>
          {last && !completion ? <button type="button" className="primary-button" disabled>Fim desta aula</button> : <button type="button" className="primary-button" onClick={() => go(index + 1)}>{last ? "Concluir aula" : "Próximo"}<ArrowRight aria-hidden="true" /></button>}
        </nav>
      )}
      {!showAll && done && (
        <nav className="stepper-nav" aria-label="Navegação da aula">
          <button type="button" onClick={() => go(steps.length - 1)}><ArrowLeft aria-hidden="true" />Rever último passo</button>
        </nav>
      )}
    </div>
  );
}
