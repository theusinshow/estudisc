"use client";
import { useId } from "react";
import type { EducationalActivityConfig } from "../application/educational-activity";
import { educationalFeedback } from "./educational-feedback";
import { exploratoryHelp, validEducationalResponse } from "@/features/lessons/interaction-policy";
import { useInteractionState } from "@/features/lessons/use-interaction-state";
import { MathText } from "@/components/ui/paragraphs";
import { OrderingField } from "./ordering-field";
import { PlacementField } from "./placement-field";
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
  const assigned = (key: string) => Object.hasOwn(assignments, key) ? assignments[key] : "";
  return <section className="learning-interaction" aria-label={prompt}>
    <h3 id={`${id}-title`}><MathText text={prompt} /></h3>
    {config.instructions && <p><MathText text={config.instructions} /></p>}
    {recovered && <p role="status">O estado salvo não corresponde a esta interação. Começamos novamente.</p>}
    <form onSubmit={event => { event.preventDefault(); update({ ...value, checked: true }); }}>
      {config.type === "numeric" && <label className="learning-field">Sua resposta<input maxLength={2000} inputMode="decimal" autoComplete="off" value={numeric} onChange={event => respond(event.target.value)} required /></label>}
      {config.type === "multiple-choice" && <fieldset><legend>Escolha uma alternativa</legend>{config.items.map(item => <label className="learning-answer" key={item.id}><input type="radio" name={id} value={item.id} checked={numeric === item.id} required onChange={() => respond(item.id)} /><span><MathText text={item.label} /></span></label>)}</fieldset>}
      {config.type === "ordering" && <OrderingField name={id} items={config.items} response={order} onChange={respond} marks={feedback?.marks} />}
      {config.type === "text-highlight" && <fieldset className="highlight-field"><legend>Toque nos trechos que sustentam sua resposta</legend><p className="highlight-passage">{config.items.map(item => <button className="highlight-chunk" type="button" aria-pressed={order.includes(item.id)} data-correct={feedback?.marks?.[item.id]} key={item.id} onClick={() => respond(order.includes(item.id) ? order.filter(key => key !== item.id) : [...order, item.id])}><span className="highlight-ink" aria-hidden="true" /><span className="highlight-text"><MathText text={item.label} /></span></button>)}</p></fieldset>}
      {(config.type === "classification" || config.type === "matching") && <PlacementField name={id} items={config.items} destinations={config.destinations} response={assignments} onChange={respond} marks={feedback?.marks} />}
      {config.type === "guided-steps" && config.steps.map((step, index) => <label className="learning-field" key={step.id}>{index + 1}. <MathText text={step.prompt} /><input maxLength={2000} value={assigned(step.id)} required inputMode={typeof step.expected === "number" ? "decimal" : "text"} onChange={event => respond({ ...assignments, [step.id]: event.target.value })} /></label>)}
      <button className="primary-button" type="submit">Conferir resposta</button>
    </form>
    {value.helpLevel > 0 && <aside className="learning-hint"><strong>{help[value.helpLevel - 1].label}</strong><p><MathText text={help[value.helpLevel - 1].text} /></p></aside>}
    {value.helpLevel < help.length && <button type="button" onClick={() => update({ ...value, helpLevel: value.helpLevel + 1 })}>{config.assistance ? `Estou travado · ${help[value.helpLevel].label}` : value.helpLevel === 0 ? "Ver uma dica" : "Ver próxima dica"}</button>}
    {feedback && <div role="status" className="learning-feedback" data-result={feedback.correct ? "correct" : feedback.partial ? "partial" : "incorrect"}><strong>{feedback.correct ? "Resposta correta" : feedback.partial ? "Parte do raciocínio está no caminho" : "Vamos revisar este passo"}</strong><p>{feedback.correct ? <MathText text={config.explanation || "Você pode continuar."} /> : feedback.partial ? feedback.matched === feedback.total ? "As partes esperadas estão presentes, mas há seleções adicionais para revisar." : `${feedback.matched} de ${feedback.total} partes conferem. Revise as demais relações e confira novamente.` : "Confira os dados e tente novamente. Uma dica pode ajudar."}</p>{!feedback.correct && (config.type === "classification" || config.type === "matching") && <details><summary>Ver os pares corretos</summary><ul>{config.items.map(item => <li key={item.id}>{item.label} → {config.destinations.find(destination => destination.id === config.expected[item.id])?.label}</li>)}</ul></details>}<small>Esta checagem é só para treinar. As questões da aula é que contam no seu progresso.</small></div>}
  </section>;
}
