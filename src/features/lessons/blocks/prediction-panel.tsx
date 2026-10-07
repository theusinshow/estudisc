"use client";
import { useId } from "react";
import { Paragraphs } from "@/components/ui/paragraphs";
import { useInteractionState } from "../use-interaction-state";
import type { InteractionTarget } from "../interaction-state";

export function PredictionPanel({ title, prompt, observation, explanation, choices = [], interaction }: Readonly<{ title: string; prompt: string; observation?: string; explanation?: string; choices?: readonly string[]; interaction: InteractionTarget }>) {
  const id = useId();
  const { value, update, recovered } = useInteractionState({ ...interaction, kind: "prediction" }, { response: "", phase: "predict" }, state => (state.phase === "predict" || state.response.trim() !== "") && (!choices.length || state.response === "" || /^(0|[1-9]\d*)$/.test(state.response) && Number(state.response) < choices.length));
  return <section className="learning-interaction" aria-label={title}>
    <h3 id={`${id}-title`}>{title}</h3><Paragraphs text={prompt}/>
    {recovered && <p role="status">A previsão salva não corresponde a esta interação. Começamos novamente.</p>}
    <form onSubmit={event => { event.preventDefault(); update({ ...value, phase: "observe" }); }}>
      {choices.length ? <fieldset><legend>Sua previsão</legend>{choices.map((choice, index) => <label className="learning-answer" key={index}><input type="radio" name={id} required checked={value.response === String(index)} onChange={() => update({ response: String(index), phase: "predict" })}/>{choice}</label>)}</fieldset> : <label className="learning-field">Sua previsão<textarea maxLength={2000} required value={value.response} onChange={event => update({ response: event.target.value, phase: "predict" })}/></label>}
      <button className="primary-button" disabled={!value.response.trim()} type="submit">Observar</button>
    </form>
    {value.phase !== "predict" && <div className="learning-hint"><strong>Observe</strong><Paragraphs text={observation || "Compare sua previsão com a demonstração desta aula."}/><button type="button" onClick={() => update({ ...value, phase: "explain" })}>Conferir explicação</button></div>}
    {value.phase === "explain" && <div role="status" className="learning-feedback" data-result="explanation"><strong>Explique o que mudou</strong><Paragraphs text={explanation || "Identifique o que confirma ou muda sua previsão e siga para a prática desta aula."}/><small>Esta previsão é exploratória. As questões registram sua prática.</small></div>}
  </section>;
}
