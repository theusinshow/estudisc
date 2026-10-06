"use client";
import { useId, useState } from "react";
import Link from "next/link";
import type { StudentQuestion } from "@/features/questions/student-view";
import { initialResponse, ResponseFields,type QuestionResponse } from "./response-fields";
import { QuestionAssets } from "@/features/questions/question-assets";
import { Paragraphs } from "@/components/ui/paragraphs";
import { TutorPanel } from "@/features/questions/tutor-panel";
import { ATTEMPT_RECORDED_EVENT } from "@/features/progress/live-progress-summary";

export function QuestionPanel({question,activityStableId,hintCount=0,sessionId,lastAnswer}:{question:StudentQuestion;activityStableId:string;hintCount?:number;sessionId?:string;lastAnswer?:unknown}) {
  const id=useId(); const [response,setResponse]=useState(()=>lastAnswer===undefined?initialResponse(question):lastAnswer as QuestionResponse); const [key,setKey]=useState(()=>crypto.randomUUID());
  const [busy,setBusy]=useState(false); const [hintLevel,setHintLevel]=useState(0); const [hint,setHint]=useState("");
  const [feedback,setFeedback]=useState<{correct:boolean;explanation?:string;attemptId?:string;xpAwarded?:number}|null>(null); const [error,setError]=useState("");
  async function send(action:"submit"|"hint"|"solution") {
    setBusy(true);setError("");
    try {
      const result=await fetch(`/api/activities/${encodeURIComponent(activityStableId)}/question`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({questionId:question.id,questionVersion:question.version,action,response,submissionKey:key,sessionId})});
      if(!result.ok)throw new Error("Não foi possível registrar. Sua resposta foi preservada; tente novamente.");
      const body=await result.json();
      if(action==="hint"){setHintLevel(body.hintLevel);setHint(body.hint??"");} else {setFeedback(body);if(body.attemptId)window.dispatchEvent(new Event(ATTEMPT_RECORDED_EVENT));}
    } catch(error) {setError(error instanceof Error?error.message:"Falha ao registrar resposta.");} finally {setBusy(false);}
  }
  return <section className="learning-interaction" aria-labelledby={`${id}-title`}>{question.stimulus&&<div className="question-stimulus"><Paragraphs text={question.stimulus}/></div>}<h3 id={`${id}-title`}>{question.stem}</h3>
    <QuestionAssets assets={question.assets}/>
    <form onSubmit={event=>{event.preventDefault();void send("submit");}}><ResponseFields id={id} question={question} response={response} disabled={busy} onChange={value=>{setResponse(value);setFeedback(null);setKey(crypto.randomUUID());}} /><button className="primary-button" disabled={busy||feedback?.correct===true} type="submit">{busy?"Registrando…":feedback?.correct?"Resposta registrada":"Enviar resposta"}</button></form>
    {hintLevel>0&&<aside className="learning-hint"><strong>Dica {hintLevel}</strong><p>{hint}</p></aside>}
    <div className="question-aids">{hintLevel<hintCount&&<button type="button" disabled={busy} onClick={()=>void send("hint")}>Ver uma dica</button>}
    <button type="button" disabled={busy} onClick={()=>void send("solution")}>Ver solução</button></div>
    {feedback&&<div role="status" aria-label="Resultado da resposta" className="learning-feedback" data-result={feedback.attemptId?(feedback.correct?"correct":"incorrect"):"solution"}><strong>{feedback.attemptId?(feedback.correct?"Resposta correta":"Ainda não"):"Solução consultada"}</strong><p>{feedback.attemptId&&!feedback.correct?"Revise o raciocínio e tente de novo. Se travar, peça uma dica.":feedback.explanation}</p>{feedback.attemptId&&<small>Tentativa registrada. Domínio depende de prática e revisão.</small>}</div>}
    {feedback?.attemptId && feedback.correct && <div className="question-study-reward">
      {typeof feedback.xpAwarded === "number" && feedback.xpAwarded > 0 && <p role="status" aria-label="Recompensas de estudo"><strong>+{feedback.xpAwarded} XP</strong> · Primeiro acerto desta questão sem ajuda.</p>}
      <Link href="/achievements">Ver minhas conquistas</Link>
    </div>}
    {error&&<p role="alert">{error}</p>}
    <TutorPanel activityId={activityStableId} questionId={question.id} questionVersion={question.version} sessionId={sessionId}/>
  </section>;
}
