"use client";
import { useId } from "react";
import { MathText, Paragraphs } from "@/components/ui/paragraphs";
import { useInteractionState } from "../use-interaction-state";
import type { InteractionTarget } from "../interaction-state";
import type { WrittenNote } from "./written-note";

const MIN_ANSWER = 3;

/** The student writes first; the expected ideas open only after "Conferir". Nothing here is an official attempt. */
export function WrittenResponsePanel({ title, note, interaction }: Readonly<{ title: string; note: WrittenNote; interaction: InteractionTarget }>) {
  const id = useId();
  const { value, update } = useInteractionState({ ...interaction, kind: "written" }, { response: "", checked: false }, state => !state.checked || state.response.trim().length >= MIN_ANSWER);
  const ready = value.response.trim().length >= MIN_ANSWER;
  const recall = note.role === "recall";
  return <section className="learning-interaction written-response" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{title}</h3>
    <Paragraphs text={note.prompt} />
    <form onSubmit={event => { event.preventDefault(); if (ready) update({ ...value, checked: true }); }}>
      <label className="learning-field">{recall ? "Sua resposta, sem olhar a aula" : "Sua resposta"}
        <textarea maxLength={2000} rows={4} value={value.response} placeholder="Escreva com suas palavras." onChange={event => update({ response: event.target.value, checked: false })} />
      </label>
      {recall && note.ideas.length > 0 && <button className="primary-button" type="submit" disabled={!ready}>Conferir</button>}
    </form>
    {recall && value.checked && <div role="status" className="learning-feedback" data-result="explanation">
      <strong>Compare com a sua resposta</strong>
      <p>Uma boa resposta fala destas ideias:</p>
      <ul>{note.ideas.map(idea => <li key={idea}><MathText text={idea} /></li>)}</ul>
      <small>Faltou alguma? Releia esse trecho da aula e tente explicar de novo.</small>
    </div>}
    {(!recall || !note.ideas.length) && <small>Sua resposta fica salva só para você. Ela não vale nota.</small>}
  </section>;
}
