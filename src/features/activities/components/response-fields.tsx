"use client";
import type { StudentQuestion } from "@/features/questions/student-view";
import { MathText } from "@/components/ui/paragraphs";

/** Answer-sheet letters; the bubble is visual only, so each radio keeps the choice text as its name. */
export const ANSWER_LETTERS = ["A","B","C","D","E","F","G","H"] as const;
export type QuestionResponse = string | string[] | Record<string,string>;
export function initialResponse(question:StudentQuestion):QuestionResponse {
  return question.type === "ordering" ? question.items.map(item=>item.id) : question.type === "matching" || question.type === "classification" ? {} : "";
}
export function ResponseFields({question,response,onChange,disabled=false,id}:{question:StudentQuestion;response:QuestionResponse;onChange:(response:QuestionResponse)=>void;disabled?:boolean;id:string}) {
  return <fieldset disabled={disabled} className={question.type === "multiple_choice" ? "answer-sheet-field" : undefined}><legend>Sua resposta{question.type === "multiple_choice" && <span className="answer-keys-hint"> · teclas A–E ou 1–5 marcam; Enter envia</span>}</legend>
    {question.type === "numeric" && <label className="learning-field"><span className="visually-hidden">Valor{question.unit?` em ${question.unit}`:""}</span><span className="numeric-input" data-unit={question.unit?"":undefined}><input inputMode="decimal" autoComplete="off" value={typeof response==="string"?response:""} onChange={event=>onChange(event.target.value)} required />{question.unit&&<span className="numeric-unit" aria-hidden="true">{question.unit}</span>}</span></label>}
    {question.type === "multiple_choice" && question.choices?.map((choice,index)=><label className="learning-answer answer-row" key={choice.id}><input type="radio" name={id} checked={response===choice.id} required onChange={()=>onChange(choice.id)} /><span className="answer-bubble" aria-hidden="true"><span className="answer-bubble-fill"/><span className="answer-bubble-letter">{ANSWER_LETTERS[index]??index+1}</span></span><span className="answer-text"><MathText text={choice.content}/></span></label>)}
    {question.type === "ordering" && Array.isArray(response) && <ol className="learning-order">{response.map((itemId,index)=><li key={itemId}><span><MathText text={question.items.find(item=>item.id===itemId)?.label??""}/></span>{[-1,1].map(offset=><button type="button" key={offset} disabled={index+offset<0||index+offset>=response.length} aria-label={`Mover ${question.items.find(item=>item.id===itemId)?.label} ${offset<0?"para cima":"para baixo"}`} onClick={()=>{const next=[...response];[next[index],next[index+offset]]=[next[index+offset],next[index]];onChange(next);}}><span aria-hidden="true">{offset<0?"↑":"↓"}</span></button>)}</li>)}</ol>}
    {(question.type === "classification" || question.type === "matching") && question.items.map(item=><label className="learning-field" key={item.id}>{item.label}<select required value={typeof response==="object"&&!Array.isArray(response)?response[item.id]??"":""} onChange={event=>onChange({...typeof response==="object"&&!Array.isArray(response)?response:{},[item.id]:event.target.value})}><option value="">Escolha um destino</option>{question.destinations.map(destination=><option value={destination.id} key={destination.id}>{destination.label}</option>)}</select></label>)}
  </fieldset>;
}
