"use client";
import { useId, useState, useSyncExternalStore } from "react";
import { openStudySession } from "./session-navigation";
import { apiErrorSchema, readValidatedResponse, sessionResponseSchema } from "@/lib/api-response";

type Props = { kind:"review";conceptId?:string;label?:string } | { kind:"remediation";mistakeId:string;label?:string };
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function TargetedPracticeControls(props:Props){
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const id=useId();const [minutes,setMinutes]=useState<10|15>(10),[busy,setBusy]=useState(false),[error,setError]=useState(""),[openSessionId,setOpenSessionId]=useState<string|null>(null);
  async function start(startNew=false){
    if(busy)return;setBusy(true);setError("");setOpenSessionId(null);
    try{
      const response=await fetch("/api/study-sessions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(props.kind==="review"?{action:"quick_review",budgetMinutes:minutes,conceptId:props.conceptId,...(startNew?{startNew:true}:{})}:{action:"practice_mistake",budgetMinutes:minutes,mistakeId:props.mistakeId,...(startNew?{startNew:true}:{})})});
      if(!response.ok){const body:unknown=await response.json();
        // Another session is open: the learner decides; nothing is reused or discarded silently.
        if(typeof body==="object"&&body!==null&&(body as {code?:unknown}).code==="session_open"&&typeof (body as {sessionId?:unknown}).sessionId==="string"){setOpenSessionId((body as {sessionId:string}).sessionId);setBusy(false);return;}
        const failure=apiErrorSchema.safeParse(body);throw new Error(failure.success?failure.data.message??"Esta prática não está disponível agora.":"Não foi possível preparar a prática. Tente novamente.");}
      const result=await readValidatedResponse(response,sessionResponseSchema);openStudySession(result.sessionId);
    }catch(failure){setError(failure instanceof Error?failure.message:"Falha de conexão. Você pode tentar novamente.");setBusy(false);}
  }
  return <div className="learning-controls targeted-practice-controls" aria-busy={busy}>
    {!ready&&<p role="status">Carregando controles da sessão…</p>}
    <label className="learning-field" htmlFor={`${id}-minutes`}>Tempo para esta prática<select id={`${id}-minutes`} value={minutes} disabled={!ready || busy} onChange={event=>setMinutes(Number(event.target.value) as 10|15)}><option value={10}>10 minutos</option><option value={15}>15 minutos</option></select></label>
    <button className="primary-button" type="button" disabled={!ready || busy} onClick={()=>void start(false)}>{busy?"Preparando…":props.label??(props.kind==="review"?"Revisão rápida":"Praticar outra questão")}</button>
    {openSessionId&&<div role="group" aria-label="Sessão em andamento" className="learning-controls"><p role="status">Você tem uma sessão de estudo em andamento. Quer continuar nela ou começar esta prática do zero?</p><button className="secondary-action" type="button" onClick={()=>openStudySession(openSessionId)}>Continuar a sessão</button><button className="primary-button" type="button" disabled={busy} onClick={()=>void start(true)}>Começar esta prática</button></div>}
    {busy&&<p role="status">Abrindo sessão…</p>}{error&&<p role="alert">{error}</p>}
  </div>;
}
