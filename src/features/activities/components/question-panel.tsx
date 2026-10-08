"use client";
import { useId, useState } from "react";
import Link from "next/link";
import type { StudentQuestion } from "@/features/questions/student-view";
import { initialResponse, ResponseFields,type QuestionResponse } from "./response-fields";
import { QuestionAssets } from "@/features/questions/question-assets";
import { Paragraphs } from "@/components/ui/paragraphs";
import { TutorPanel } from "@/features/questions/tutor-panel";
import { ATTEMPT_RECORDED_EVENT } from "@/features/progress/live-progress-summary";
import { useLessonResume } from "@/features/lessons/resume-provider";
import { usableDraft } from "@/features/lessons/resume-contracts";
import { draftResponseMatches } from "@/features/lessons/resume-policy";

export function QuestionPanel({question,activityStableId,hintCount=0,sessionId,lastAnswer,lastAttempt,assistance,aiEnabled=false}:{question:StudentQuestion;activityStableId:string;hintCount?:number;sessionId?:string;aiEnabled?:boolean;lastAnswer?:unknown;lastAttempt?:{attemptId:string;submissionKey:string;correct:boolean;explanation?:string};assistance?:{hintLevel:number;hint:string;solutionRevealed:boolean;explanation?:string}}) {
  const resume=useLessonResume();
  const draft=usableDraft(resume?.data.drafts.find(entry=>entry.activityId===activityStableId&&entry.questionId===question.id&&entry.questionVersion===question.version&&draftResponseMatches(question.type,entry.response)),lastAttempt);
  const id=useId(); const [response,setResponse]=useState(()=>draft?.response??(lastAnswer==null||!draftResponseMatches(question.type,lastAnswer)?initialResponse(question):lastAnswer as QuestionResponse)); const [key,setKey]=useState(()=>draft?.submissionKey??crypto.randomUUID());
  const [baseAttemptId,setBaseAttemptId]=useState(lastAttempt?.attemptId??null);
  const [busy,setBusy]=useState(false); const [hintLevel,setHintLevel]=useState(assistance?.hintLevel??0); const [hint,setHint]=useState(assistance?.hint??"");
  const [feedback,setFeedback]=useState<{correct:boolean;explanation?:string;attemptId?:string;xpAwarded?:number}|null>(()=>{
    const revealed=assistance?.solutionRevealed?{correct:false,explanation:assistance.explanation}:null;
    return draft?revealed:lastAttempt??revealed;
  }); const [error,setError]=useState("");
  async function send(action:"submit"|"hint"|"solution") {
    setBusy(true);setError("");
    try {
      const result=await fetch(`/api/activities/${encodeURIComponent(activityStableId)}/question`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({questionId:question.id,questionVersion:question.version,action,response,submissionKey:key,sessionId})});
      if(!result.ok)throw new Error("Não foi possível registrar. Sua resposta foi preservada; tente novamente.");
      const body=await result.json();
      if(action==="hint"){setHintLevel(body.hintLevel);setHint(body.hint??"");} else {setFeedback(body);if(body.attemptId){setBaseAttemptId(body.attemptId);resume?.setDraft(undefined,activityStableId);window.dispatchEvent(new Event(ATTEMPT_RECORDED_EVENT));}}
    } catch(error) {setError(error instanceof Error?error.message:"Falha ao registrar resposta.");} finally {setBusy(false);}
  }
  return <section className="learning-interaction" aria-labelledby={`${id}-title`}>{question.stimulus&&<div className="question-stimulus"><Paragraphs text={question.stimulus}/></div>}<h3 id={`${id}-title`}>{question.stem}</h3>
    <QuestionAssets assets={question.assets}/>
    <form onSubmit={event=>{event.preventDefault();void send("submit");}}><ResponseFields id={id} question={question} response={response} disabled={busy} onChange={value=>{const submissionKey=crypto.randomUUID();setResponse(value);setFeedback(null);setKey(submissionKey);resume?.setDraft({activityId:activityStableId,questionId:question.id,questionVersion:question.version,response:value,submissionKey,baseAttemptId},activityStableId);}} /><button className="primary-button" disabled={busy||feedback?.correct===true} type="submit">{busy?"Registrando…":feedback?.correct?"Resposta registrada":"Enviar resposta"}</button></form>
    {hintLevel>0&&<aside className="learning-hint"><strong>Dica {hintLevel}</strong><p>{hint}</p></aside>}
    <div className="question-aids">{hintLevel<hintCount&&<button type="button" disabled={busy} onClick={()=>void send("hint")}>Ver uma dica</button>}
    <button type="button" disabled={busy} onClick={()=>void send("solution")}>Ver solução</button></div>
    {feedback&&<div role="status" aria-label="Resultado da resposta" className="learning-feedback" data-result={feedback.attemptId?(feedback.correct?"correct":"incorrect"):"solution"}><strong>{feedback.attemptId?(feedback.correct?"Resposta correta":"Ainda não"):"Solução consultada"}</strong><p>{feedback.attemptId&&!feedback.correct?"Revise o raciocínio e tente de novo. Se travar, peça uma dica.":feedback.explanation}</p>{feedback.attemptId&&<small>Tentativa registrada. Domínio depende de prática e revisão.</small>}</div>}
    {feedback?.attemptId && feedback.correct && <div className="question-study-reward">
      {typeof feedback.xpAwarded === "number" && feedback.xpAwarded > 0 && <p role="status" aria-label="Recompensas de estudo"><strong>+{feedback.xpAwarded} XP</strong> · Primeiro acerto desta questão sem ajuda.</p>}
      <Link href="/achievements">Ver minhas conquistas</Link>
    </div>}
    {error&&<p role="alert">{error}</p>}
    <TutorPanel activityId={activityStableId} questionId={question.id} questionVersion={question.version} sessionId={sessionId} enhanced={aiEnabled}/>
  </section>;
}
