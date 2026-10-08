"use client";
import { useId, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { apiErrorSchema, readValidatedResponse, sessionResponseSchema } from "@/lib/api-response";

type Props = { kind:"review";conceptId?:string;label?:string } | { kind:"remediation";mistakeId:string;label?:string };
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function TargetedPracticeControls(props:Props){
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const id=useId(),router=useRouter();const [minutes,setMinutes]=useState<10|15>(10),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function start(){
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/study-sessions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(props.kind==="review"?{action:"quick_review",budgetMinutes:minutes,conceptId:props.conceptId}:{action:"practice_mistake",budgetMinutes:minutes,mistakeId:props.mistakeId})});
      if(!response.ok){const failure=apiErrorSchema.safeParse(await response.json());throw new Error(failure.success?failure.data.message??"Esta prática não está disponível agora.":"Não foi possível preparar a prática. Tente novamente.");}
      const result=await readValidatedResponse(response,sessionResponseSchema);router.push(`/study/${result.sessionId}`);router.refresh();
    }catch(failure){setError(failure instanceof Error?failure.message:"Falha de conexão. Você pode tentar novamente.");}finally{setBusy(false);}
  }
  return <div className="learning-controls targeted-practice-controls" aria-busy={busy}>
    <label className="learning-field" htmlFor={`${id}-minutes`}>Tempo para esta prática<select id={`${id}-minutes`} value={minutes} disabled={!ready || busy} onChange={event=>setMinutes(Number(event.target.value) as 10|15)}><option value={10}>10 minutos</option><option value={15}>15 minutos</option></select></label>
    <button className="primary-button" type="button" disabled={!ready || busy} onClick={()=>void start()}>{busy?"Preparando…":props.label??(props.kind==="review"?"Revisão rápida":"Praticar outra questão")}</button>
    {error&&<p role="alert">{error}</p>}
  </div>;
}
