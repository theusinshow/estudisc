"use client";

import { useId, useState } from "react";
import { evaluateEducationalActivity, type EducationalActivityConfig } from "../application/educational-activity";

export function EducationalActivityPanel({ prompt, config }: { prompt: string; config: EducationalActivityConfig }) {
  const id = useId();
  const [numeric, setNumeric] = useState("");
  const [order, setOrder] = useState(() => config.type === "ordering" ? config.items.map(item => item.id) : []);
  const [selected, setSelected] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [hintLevel, setHintLevel] = useState(0);
  const [feedback, setFeedback] = useState<ReturnType<typeof evaluateEducationalActivity> | null>(null);
  const response = config.type === "numeric" || config.type === "multiple-choice" ? numeric : config.type === "ordering" ? order : config.type === "text-highlight" ? selected : assignments;
  const move = (index: number, offset: number) => { const updated = [...order]; [updated[index], updated[index + offset]] = [updated[index + offset], updated[index]]; setOrder(updated); setFeedback(null); };
  return <section className="learning-interaction" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{prompt}</h3>
    {config.instructions && <p>{config.instructions}</p>}
    <form onSubmit={event => { event.preventDefault(); setFeedback(evaluateEducationalActivity(config, response)); }}>
      {config.type === "numeric" && <label className="learning-field">Sua resposta<input inputMode="decimal" autoComplete="off" value={numeric} onChange={event => { setNumeric(event.target.value); setFeedback(null); }} required /></label>}
      {config.type === "multiple-choice" && <fieldset><legend>Escolha uma alternativa</legend>{config.items.map(item => <label className="learning-answer" key={item.id}><input type="radio" name={id} value={item.id} checked={numeric === item.id} required onChange={() => { setNumeric(item.id); setFeedback(null); }} />{item.label}</label>)}</fieldset>}
      {config.type === "ordering" && <ol className="learning-order">{order.map((itemId, index) => <li key={itemId}><span>{config.items.find(item => item.id === itemId)?.label}</span><div className="learning-controls"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Mover ${config.items.find(item => item.id === itemId)?.label} para cima`}>Subir</button><button type="button" onClick={() => move(index, 1)} disabled={index === order.length - 1} aria-label={`Mover ${config.items.find(item => item.id === itemId)?.label} para baixo`}>Descer</button></div></li>)}</ol>}
      {config.type === "text-highlight" && <fieldset><legend>Selecione os trechos que sustentam sua resposta</legend>{config.items.map(item => <button className="learning-answer" type="button" aria-pressed={selected.includes(item.id)} key={item.id} onClick={() => { setSelected(selected.includes(item.id) ? selected.filter(id => id !== item.id) : [...selected, item.id]); setFeedback(null); }}>{selected.includes(item.id) ? "Selecionado: " : ""}{item.label}</button>)}</fieldset>}
      {(config.type === "classification" || config.type === "matching") && config.items.map(item => <label className="learning-field" key={item.id}>{item.label}<select value={assignments[item.id] ?? ""} required onChange={event => { setAssignments({ ...assignments, [item.id]: event.target.value }); setFeedback(null); }}><option value="">Escolha um destino</option>{config.destinations.map(destination => <option value={destination.id} key={destination.id}>{destination.label}</option>)}</select></label>)}
      {config.type === "guided-steps" && config.steps.map((step, index) => <label className="learning-field" key={step.id}>{index + 1}. {step.prompt}<input value={assignments[step.id] ?? ""} required inputMode={typeof step.expected === "number" ? "decimal" : "text"} onChange={event => { setAssignments({ ...assignments, [step.id]: event.target.value }); setFeedback(null); }} /></label>)}
      <button className="primary-button" type="submit">Conferir exercício guiado</button>
    </form>
    {hintLevel > 0 && <aside className="learning-hint"><strong>Dica {hintLevel}</strong><p>{config.hints[hintLevel - 1]}</p></aside>}
    {hintLevel < config.hints.length && <button type="button" onClick={() => setHintLevel(hintLevel + 1)}>Ver {hintLevel === 0 ? "uma dica" : "próxima dica"}</button>}
    {feedback && <div role="status" className="learning-feedback"><strong>{feedback.correct ? "Resposta correta" : "Vamos revisar este passo"}</strong><p>{config.explanation || (feedback.correct ? "Você pode continuar." : "Confira os dados e tente novamente. Uma dica pode ajudar.")}</p></div>}
  </section>;
}
