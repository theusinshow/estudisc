"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type LessonStep = { id: string; kind: "intro" | "concept" | "example" | "warning" | "summary" | "check" | "practice" | "exit" | "interaction"; label: string; node: ReactNode };

/** Shows one step at a time. Every step stays mounted, so answers and feedback survive navigation. */
export function LessonStepper({ steps }: Readonly<{ steps: LessonStep[] }>) {
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const go = (next: number) => {
    setIndex(next);
    // Scroll the window (not an inner container) only when the step start left the viewport.
    const box = top.current?.getBoundingClientRect();
    if (box && box.top < 0) window.scrollTo({ top: window.scrollY + box.top - 96 });
  };
  const current = steps[index];
  const last = index === steps.length - 1;

  return (
    <div className="lesson-stepper" ref={top} data-mode={showAll ? "all" : "step"}>
      <div className="stepper-head">
        {showAll ? <span className="stepper-count">Aula inteira · {steps.length} partes</span> : <span className="stepper-count" aria-live="polite">Passo {index + 1} de {steps.length} · <strong>{current?.label}</strong></span>}
        <button type="button" className="stepper-toggle" onClick={() => setShowAll(value => !value)} aria-pressed={showAll}>{showAll ? "Um passo por vez" : "Ver tudo"}</button>
        {!showAll && <progress className="stepper-bar" value={index + 1} max={steps.length} aria-label="Progresso da aula" />}
      </div>
      {steps.map((step, position) => (
        <section className="lesson-step" data-kind={step.kind} key={step.id} hidden={!showAll && position !== index} aria-label={step.label}>
          {step.node}
        </section>
      ))}
      {!showAll && (
        <nav className="stepper-nav" aria-label="Navegação da aula">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0}><ArrowLeft aria-hidden="true" />Voltar</button>
          <button type="button" className="primary-button" onClick={() => go(index + 1)} disabled={last}>{last ? "Fim da aula" : <>Próximo<ArrowRight aria-hidden="true" /></>}</button>
        </nav>
      )}
    </div>
  );
}
