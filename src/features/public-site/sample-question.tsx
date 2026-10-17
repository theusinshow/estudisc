"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Check, RotateCcw } from "lucide-react";
import { MathText } from "@/components/ui/paragraphs";

export type SampleQuestionData = Readonly<{
  lessonTitle: string;
  subject: string;
  stem: string;
  choices: ReadonlyArray<{ id: string; content: string }>;
  correctChoiceId: string;
  explanation?: string;
}>;

const letters = ["A", "B", "C", "D", "E", "F"];

/**
 * A real published question from a free sample lesson, solvable on the landing page. Nothing is
 * recorded: there is no account here, so it is never an Attempt, evidence or mastery.
 */
export function SampleQuestion({ question }: Readonly<{ question: SampleQuestionData }>) {
  const id = useId();
  const [choice, setChoice] = useState("");
  const [checked, setChecked] = useState(false);
  const correct = checked && choice === question.correctChoiceId;
  function pickByKey(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const letter = "abcdef".indexOf(event.key.toLowerCase()), digit = /^[1-6]$/.test(event.key) ? Number(event.key) - 1 : -1;
    const index = event.key.length === 1 && letter >= 0 ? letter : digit;
    const radio = index >= 0 ? event.currentTarget.querySelectorAll<HTMLInputElement>("input[type=radio]")[index] : undefined;
    if (!radio) return;
    event.preventDefault(); radio.click(); radio.focus();
  }
  return <section className="sample-question learning-interaction question-sheet" aria-labelledby={`${id}-stem`} onKeyDown={pickByKey}>
    <p className="sample-question-source type-meta">Questão de amostra · {question.subject} · aula “{question.lessonTitle}”</p>
    <h2 id={`${id}-stem`} className="sample-question-stem"><MathText text={question.stem} /></h2>
    <form onSubmit={event => { event.preventDefault(); if (choice) setChecked(true); }}>
      <fieldset className="answer-sheet-field"><legend>Sua resposta<span className="answer-keys-hint"> · teclas A–E marcam; Enter confere</span></legend>
        {question.choices.map((entry, index) => <label className="learning-answer answer-row" key={entry.id}>
          <input type="radio" name={id} checked={choice === entry.id} required onChange={() => { setChoice(entry.id); setChecked(false); }} />
          <span className="answer-bubble" aria-hidden="true"><span className="answer-bubble-fill" /><span className="answer-bubble-letter">{letters[index]}</span></span>
          <span className="answer-text"><MathText text={entry.content} /></span>
        </label>)}
      </fieldset>
      <button type="submit" className="primary-button sample-question-check" disabled={!choice}>Conferir resposta</button>
    </form>
    <div className="answer-result" aria-live="polite" aria-atomic="true">
      {checked && <div role="status" aria-live="off" aria-label="Resultado da amostra" className="learning-feedback" data-result={correct ? "correct" : "incorrect"}>
        <span className="answer-stamp" data-result={correct ? "correct" : "incorrect"} aria-hidden="true">{correct ? <Check /> : <RotateCcw />}{correct ? "Certo" : "Revise"}</span>
        <strong>{correct ? "Resposta correta" : "Ainda não"}</strong>
        <p>{correct ? (question.explanation ? <MathText text={question.explanation} /> : null) : "Releia o enunciado e tente outra alternativa. Na aula completa, você pode pedir uma dica."}</p>
      </div>}
    </div>
  </section>;
}
