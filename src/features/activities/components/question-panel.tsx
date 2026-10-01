"use client";
import { useId, useState } from "react";
import type { StudentQuestion } from "@/features/questions/student-view";
import { initialResponse, ResponseFields,type QuestionResponse } from "./response-fields";

export function QuestionPanel({question,activityStableId,hints=[],sessionId,lastAnswer}:{question:StudentQuestion;activityStableId:string;hints?:string[];sessionId?:string;lastAnswer?:unknown}) {
  const id=useId(); const [response,setResponse]=useState(()=>lastAnswer===undefined?initialResponse(question):lastAnswer as QuestionResponse); const [key,setKey]=useState(()=>crypto.randomUUID());
  const [busy,setBusy]=useState(false); const [hintLevel,setHintLevel]=useState(0);
  const [feedback,setFeedback]=useState<{correct:boolean;explanation?:string;attemptId?:string}|null>(null); const [error,setError]=useState("");
  async function send(action:"submit"|"hint"|"solution") {
    setBusy(true);setError("");
    try {
      const result=await fetch(`/api/activities/${encodeURIComponent(activityStableId)}/question`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({questionId:question.id,questionVersion:question.version,action,response,submissionKey:key,sessionId})});
      if(!result.ok)throw new Error("Não foi possível registrar. Sua resposta foi preservada; tente novamente.");
      const body=await result.json();
      if(action==="hint")setHintLevel(body.hintLevel); else setFeedback(body);
    } catch(error) {setError(error instanceof Error?error.message:"Falha ao registrar resposta.");} finally {setBusy(false);}
  }
  return <section className="learning-interaction" aria-labelledby={`${id}-title`}><h3 id={`${id}-title`}>{question.stem}</h3>{question.stimulus&&<p>{question.stimulus}</p>}
    <form onSubmit={event=>{event.preventDefault();void send("submit");}}><ResponseFields id={id} question={question} response={response} disabled={busy} onChange={value=>{setResponse(value);setFeedback(null);setKey(crypto.randomUUID());}} /><button className="primary-button" disabled={busy} type="submit">{busy?"Registrando…":"Enviar resposta"}</button></form>
    {hintLevel>0&&<aside className="learning-hint"><strong>Dica {hintLevel}</strong><p>{hints[hintLevel-1]}</p></aside>}
    {hintLevel<hints.length&&<button type="button" disabled={busy} onClick={()=>void send("hint")}>Ver uma dica</button>}
    <button type="button" disabled={busy} onClick={()=>void send("solution")}>Ver solução</button>
    {feedback&&<div role="status" className="learning-feedback"><strong>{feedback.attemptId?(feedback.correct?"Resposta correta":"Vamos revisar"):"Solução consultada"}</strong><p>{feedback.explanation}</p>{feedback.attemptId&&<small>Tentativa registrada. Domínio depende de prática e revisão.</small>}</div>}
    {error&&<p role="alert">{error}</p>}
  </section>;
}
