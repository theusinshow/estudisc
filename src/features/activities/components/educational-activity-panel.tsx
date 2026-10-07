"use client";
import { useId } from "react";
import type { EducationalActivityConfig } from "../application/educational-activity";
import { educationalFeedback } from "./educational-feedback";
import { exploratoryHelp, validEducationalResponse } from "@/features/lessons/interaction-policy";
import { useInteractionState } from "@/features/lessons/use-interaction-state";
import type { InteractionTarget, StateFor } from "@/features/lessons/interaction-state";

export function EducationalActivityPanel({ prompt, config, interaction }: { prompt: string; config: EducationalActivityConfig; interaction?: InteractionTarget }) {
  const id = useId(), help = exploratoryHelp(config);
  const initialResponse = config.type === "numeric" || config.type === "multiple-choice" ? "" : config.type === "ordering" ? config.items.map(item => item.id) : config.type === "text-highlight" ? [] : Object.create(null) as Record<string, string>;
  const { value, update, recovered } = useInteractionState(interaction ? { ...interaction, kind: "educational" } : undefined, { response: initialResponse, helpLevel: 0, checked: false }, state => validEducationalResponse(config, state.response) && state.helpLevel <= help.length);
  const numeric = typeof value.response === "string" ? value.response : "";
  const order = Array.isArray(value.response) ? value.response : [];
  const assignments = typeof value.response === "object" && !Array.isArray(value.response) ? value.response : Object.create(null) as Record<string, string>;
  const feedback = value.checked ? educationalFeedback(config, value.response) : null;
  const respond = (response: StateFor<"educational">["response"]) => update({ ...value, response, checked: false });
  const move = (index: number, offset: number) => { const next = [...order]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; respond(next); };
  const assigned = (key: string) => Object.hasOwn(assignments, key) ? assignments[key] : "";
  return <section className="learning-interaction" aria-label={prompt}>
    <h3 id={`${id}-title`}>{prompt}</h3>
    {config.instructions && <p>{config.instructions}</p>}
    {recovered && <p role="status">O estado salvo não corresponde a esta interação. Começamos novamente.</p>}
    <form onSubmit={event => { event.preventDefault(); update({ ...value, checked: true }); }}>
      {config.type === "numeric" && <label className="learning-field">Sua resposta<input maxLength={2000} inputMode="decimal" autoComplete="off" value={numeric} onChange={event => respond(event.target.value)} required /></label>}
      {config.type === "multiple-choice" && <fieldset><legend>Escolha uma alternativa</legend>{config.items.map(item => <label className="learning-answer" key={item.id}><input type="radio" name={id} value={item.id} checked={numeric === item.id} required onChange={() => respond(item.id)} />{item.label}</label>)}</fieldset>}
      {config.type === "ordering" && <ol className="learning-order">{order.map((itemId, index) => <li key={itemId}><span>{config.items.find(item => item.id === itemId)?.label}</span><div className="learning-controls"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Mover ${config.items.find(item => item.id === itemId)?.label} para cima`}>Subir</button><button type="button" onClick={() => move(index, 1)} disabled={index === order.length - 1} aria-label={`Mover ${config.items.find(item => item.id === itemId)?.label} para baixo`}>Descer</button></div></li>)}</ol>}
      {config.type === "text-highlight" && <fieldset><legend>Selecione os trechos que sustentam sua resposta</legend>{config.items.map(item => <button className="learning-answer" type="button" aria-pressed={order.includes(item.id)} key={item.id} onClick={() => respond(order.includes(item.id) ? order.filter(key => key !== item.id) : [...order, item.id])}>{order.includes(item.id) ? "Selecionado: " : ""}{item.label}</button>)}</fieldset>}
      {(config.type === "classification" || config.type === "matching") && config.items.map(item => <label className="learning-field" key={item.id}>{item.label}<select value={assigned(item.id)} required onChange={event => respond({ ...assignments, [item.id]: event.target.value })}><option value="">Escolha um destino</option>{config.destinations.map(destination => <option value={destination.id} key={destination.id}>{destination.label}</option>)}</select></label>)}
      {config.type === "guided-steps" && config.steps.map((step, index) => <label className="learning-field" key={step.id}>{index + 1}. {step.prompt}<input maxLength={2000} value={assigned(step.id)} required inputMode={typeof step.expected === "number" ? "decimal" : "text"} onChange={event => respond({ ...assignments, [step.id]: event.target.value })} /></label>)}
      <button className="primary-button" type="submit">Conferir resposta</button>
    </form>
    {value.helpLevel > 0 && <aside className="learning-hint"><strong>{help[value.helpLevel - 1].label}</strong><p>{help[value.helpLevel - 1].text}</p></aside>}
    {value.helpLevel < help.length && <button type="button" onClick={() => update({ ...value, helpLevel: value.helpLevel + 1 })}>{config.assistance ? `Estou travado · ${help[value.helpLevel].label}` : value.helpLevel === 0 ? "Ver uma dica" : "Ver próxima dica"}</button>}
    {feedback && <div role="status" className="learning-feedback" data-result={feedback.correct ? "correct" : feedback.partial ? "partial" : "incorrect"}><strong>{feedback.correct ? "Resposta correta" : feedback.partial ? "Parte do raciocínio está no caminho" : "Vamos revisar este passo"}</strong><p>{feedback.correct ? config.explanation || "Você pode continuar." : feedback.partial ? feedback.matched === feedback.total ? "As partes esperadas estão presentes, mas há seleções adicionais para revisar." : `${feedback.matched} de ${feedback.total} partes conferem. Revise as demais relações e confira novamente.` : "Confira os dados e tente novamente. Uma dica pode ajudar."}</p><small>Checagem exploratória. Responda às questões da aula para registrar prática.</small></div>}
  </section>;
}
