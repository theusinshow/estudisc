"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ATTEMPT_RECORDED_EVENT, type AttemptRecordedDetail } from "@/features/progress/live-progress-summary";
import { openStudySession } from "./session-navigation";

type Step = Readonly<{ stableId: string; questionId: string; node: ReactNode }>;

/**
 * ADR 0072: one Question at a time. The question panel records each Attempt; this component only moves between
 * steps and completes the block once every Question has an Attempt (whichever tab answered it).
 */
export function PracticeBlockStepper({ sessionId, steps, answeredQuestionIds }: Readonly<{ sessionId: string; steps: readonly Step[]; answeredQuestionIds: readonly string[] }>) {
  const [answered, setAnswered] = useState(() => new Set(answeredQuestionIds));
  const [index, setIndex] = useState(() => { const open = steps.findIndex(step => !answeredQuestionIds.includes(step.questionId)); return open === -1 ? steps.length - 1 : open; });
  const [closed, setClosed] = useState(false), [error, setError] = useState("");
  const closing = useRef(false), progress = useRef<HTMLParagraphElement>(null);
  const total = steps.length, current = steps[index], count = steps.filter(step => answered.has(step.questionId)).length, done = count === total;
  useEffect(() => {
    const onAttempt = (event: Event) => {
      const detail = (event as CustomEvent<AttemptRecordedDetail>).detail;
      if (detail?.questionId) setAnswered(previous => new Set(previous).add(detail.questionId));
    };
    window.addEventListener(ATTEMPT_RECORDED_EVENT, onAttempt);
    return () => window.removeEventListener(ATTEMPT_RECORDED_EVENT, onAttempt);
  }, []);
  // State changes only after the request settles, so the effect below never updates state synchronously.
  const complete = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", sessionId }) })
      .then(response => { if (!response.ok) throw new Error("complete failed"); setError(""); setClosed(true); })
      .catch(() => { closing.current = false; setError("Não foi possível fechar o bloco. Tente de novo."); });
  }, [sessionId]);
  useEffect(() => { if (done) complete(); }, [done, complete]);
  function next() {
    setIndex(index + 1);
    window.scrollTo({ top: 0 });
    progress.current?.focus();
  }
  if (!current) return null;
  return <div className="practice-block">
    <div className="practice-block-progress">
      <p ref={progress} tabIndex={-1} aria-live="polite">{index + 1} de {total}</p>
      <progress max={total} value={count} aria-label="Questões respondidas no bloco" />
    </div>
    {steps.map((step, position) => <div key={step.stableId} hidden={position !== index}>{step.node}</div>)}
    <div className="practice-block-next">
      {answered.has(current.questionId) && index < total - 1 && <button className="primary-button" type="button" onClick={next}>Próxima</button>}
      {done && (closed
        ? <button className="primary-button" type="button" onClick={() => openStudySession(sessionId)}>Ver resumo</button>
        : error ? <button className="primary-button" type="button" onClick={complete}>Tentar de novo</button>
        : <p role="status">Fechando o bloco…</p>)}
      {error && <p role="alert">{error}</p>}
    </div>
  </div>;
}
