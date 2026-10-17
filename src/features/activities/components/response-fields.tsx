"use client";
import type { StudentQuestion } from "@/features/questions/student-view";
import { MathText } from "@/components/ui/paragraphs";
import type { AnswerKey } from "@/features/questions/answer-feedback";
import { OrderingField } from "./ordering-field";
import { PlacementField } from "./placement-field";

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
    {question.type === "ordering" && Array.isArray(response) && <OrderingField name={id} items={question.items} response={response} onChange={onChange} marks={review?.marks} disabled={disabled} />}
    {question.type === "ordering" && key?.kind==="ordering" && <p className="item-key">Ordem correta: {key.orderedIds.map(itemId=>question.items.find(item=>item.id===itemId)?.label).join(" → ")}</p>}
    {(question.type === "classification" || question.type === "matching") && <PlacementField name={id} items={question.items} destinations={question.destinations} response={typeof response==="object"&&!Array.isArray(response)?response:{}} onChange={onChange} marks={review?.marks} pairs={pairs} disabled={disabled} />}
  </fieldset>;
}
