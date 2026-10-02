"use client";
import type { StudentQuestion } from "@/features/questions/student-view";

export type QuestionResponse = string | string[] | Record<string,string>;
export function initialResponse(question:StudentQuestion):QuestionResponse {
  return question.type === "ordering" ? question.items.map(item=>item.id) : question.type === "matching" || question.type === "classification" ? {} : "";
}
export function ResponseFields({question,response,onChange,disabled=false,id}:{question:StudentQuestion;response:QuestionResponse;onChange:(response:QuestionResponse)=>void;disabled?:boolean;id:string}) {
  return <fieldset disabled={disabled}><legend>Sua resposta</legend>
    {question.type === "numeric" && <label className="learning-field"><span className="visually-hidden">Valor{question.unit?` em ${question.unit}`:""}</span><span className="numeric-input" data-unit={question.unit?"":undefined}><input inputMode="decimal" autoComplete="off" value={typeof response==="string"?response:""} onChange={event=>onChange(event.target.value)} required />{question.unit&&<span className="numeric-unit" aria-hidden="true">{question.unit}</span>}</span></label>}
    {question.type === "multiple_choice" && question.choices?.map(choice=><label className="learning-answer" key={choice.id}><input type="radio" name={id} checked={response===choice.id} required onChange={()=>onChange(choice.id)} />{choice.content}</label>)}
    {question.type === "ordering" && Array.isArray(response) && <ol className="learning-order">{response.map((itemId,index)=><li key={itemId}><span>{question.items.find(item=>item.id===itemId)?.label}</span>{[-1,1].map(offset=><button type="button" key={offset} disabled={index+offset<0||index+offset>=response.length} aria-label={`Mover ${question.items.find(item=>item.id===itemId)?.label} ${offset<0?"para cima":"para baixo"}`} onClick={()=>{const next=[...response];[next[index],next[index+offset]]=[next[index+offset],next[index]];onChange(next);}}>{offset<0?"Subir":"Descer"}</button>)}</li>)}</ol>}
    {(question.type === "classification" || question.type === "matching") && question.items.map(item=><label className="learning-field" key={item.id}>{item.label}<select required value={typeof response==="object"&&!Array.isArray(response)?response[item.id]??"":""} onChange={event=>onChange({...typeof response==="object"&&!Array.isArray(response)?response:{},[item.id]:event.target.value})}><option value="">Escolha um destino</option>{question.destinations.map(destination=><option value={destination.id} key={destination.id}>{destination.label}</option>)}</select></label>)}
  </fieldset>;
}
