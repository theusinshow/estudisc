"use client";
import type { StudentQuestion } from "@/features/questions/student-view";
import { MathText } from "@/components/ui/paragraphs";
import type { AnswerKey } from "@/features/questions/answer-feedback";

/** Answer-sheet letters; the bubble is visual only, so each radio keeps the choice text as its name. */
export const ANSWER_LETTERS = ["A","B","C","D","E","F","G","H"] as const;
export type QuestionResponse = string | string[] | Record<string,string>;
export function initialResponse(question:StudentQuestion):QuestionResponse {
  return question.type === "ordering" ? question.items.map(item=>item.id) : question.type === "matching" || question.type === "classification" ? {} : "";
}
/** Corrections after a wrong answer: a mark per part, and the expected answer once the solution is open. */
export type ResponseReview = { marks?: Record<string,boolean>; answerKey?: AnswerKey };
/** The select keeps the item name as its label; the mark is its description. */
export function ItemMark({correct,id}:{correct?:boolean;id?:string}) {
  return correct===undefined?null:<span className="item-mark" id={id} data-correct={correct}>{correct?"✓ Certo":"✗ Revise"}</span>;
}
export function ResponseFields({question,response,onChange,disabled=false,id,review}:{question:StudentQuestion;response:QuestionResponse;onChange:(response:QuestionResponse)=>void;disabled?:boolean;id:string;review?:ResponseReview}) {
  const key=review?.answerKey; const pairs=key&&"pairs" in key?key.pairs:undefined;
  return <fieldset disabled={disabled} className={question.type === "multiple_choice" ? "answer-sheet-field" : undefined}><legend>Sua resposta{question.type === "multiple_choice" && <span className="answer-keys-hint"> · teclas A–E ou 1–5 marcam; Enter envia</span>}</legend>
    {question.type === "numeric" && <label className="learning-field"><span className="visually-hidden">Valor{question.unit?` em ${question.unit}`:""}</span><span className="numeric-input" data-unit={question.unit?"":undefined}><input inputMode="decimal" autoComplete="off" value={typeof response==="string"?response:""} onChange={event=>onChange(event.target.value)} required />{question.unit&&<span className="numeric-unit" aria-hidden="true">{question.unit}</span>}</span></label>}
    {question.type === "multiple_choice" && question.choices?.map((choice,index)=><label className="learning-answer answer-row" key={choice.id} data-key={key?.kind==="multiple_choice"&&key.choiceId===choice.id||undefined}><input type="radio" name={id} checked={response===choice.id} required onChange={()=>onChange(choice.id)} /><span className="answer-bubble" aria-hidden="true"><span className="answer-bubble-fill"/><span className="answer-bubble-letter">{ANSWER_LETTERS[index]??index+1}</span></span><span className="answer-text"><MathText text={choice.content}/>{key?.kind==="multiple_choice"&&key.choiceId===choice.id&&<span className="item-key"> · resposta correta</span>}</span></label>)}
    {question.type === "ordering" && Array.isArray(response) && <ol className="learning-order">{response.map((itemId,index)=><li key={itemId}><span><MathText text={question.items.find(item=>item.id===itemId)?.label??""}/></span><ItemMark correct={review?.marks?.[`${index}`]}/>{[-1,1].map(offset=><button type="button" key={offset} disabled={index+offset<0||index+offset>=response.length} aria-label={`Mover ${question.items.find(item=>item.id===itemId)?.label} ${offset<0?"para cima":"para baixo"}`} onClick={()=>{const next=[...response];[next[index],next[index+offset]]=[next[index+offset],next[index]];onChange(next);}}><span aria-hidden="true">{offset<0?"↑":"↓"}</span></button>)}</li>)}</ol>}
    {question.type === "ordering" && key?.kind==="ordering" && <p className="item-key">Ordem correta: {key.orderedIds.map(itemId=>question.items.find(item=>item.id===itemId)?.label).join(" → ")}</p>}
    {(question.type === "classification" || question.type === "matching") && question.items.map(item=><label className="learning-field" key={item.id}><span><span id={`${id}-${item.id}-name`}>{item.label}</span> <ItemMark id={`${id}-${item.id}-mark`} correct={review?.marks?.[item.id]}/>{pairs?.[item.id]&&<span className="item-key">Correto: {question.destinations.find(destination=>destination.id===pairs[item.id])?.label}</span>}</span><select aria-labelledby={`${id}-${item.id}-name`} aria-describedby={review?.marks?.[item.id]===undefined?undefined:`${id}-${item.id}-mark`} required value={typeof response==="object"&&!Array.isArray(response)?response[item.id]??"":""} onChange={event=>onChange({...typeof response==="object"&&!Array.isArray(response)?response:{},[item.id]:event.target.value})}><option value="">Selecione…</option>{question.destinations.map(destination=><option value={destination.id} key={destination.id}>{destination.label}</option>)}</select></label>)}
  </fieldset>;
}
