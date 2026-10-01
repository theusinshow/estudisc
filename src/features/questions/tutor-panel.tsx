"use client";
import {useId,useState} from "react";
export function TutorPanel({activityId,questionId,questionVersion,sessionId}:{activityId:string;questionId:string;questionVersion:number;sessionId?:string}){
  const id=useId(),[mode,setMode]=useState("QUESTION_HELP"),[message,setMessage]=useState("Como posso começar este raciocínio?"),[text,setText]=useState(""),[busy,setBusy]=useState(false);
  return <details className="activity-technical-details"><summary>Tutor opcional</summary><p>Consultar o tutor registra ajuda nesta questão. A explicação da aula é a referência.</p><form onSubmit={async event=>{event.preventDefault();setBusy(true);try{const response=await fetch("/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({activityId,questionId,questionVersion,sessionId,mode,message})});const body=await response.json();setText(body.text??body.message??"Tutor indisponível.");}catch{setText("Falha de conexão. Você pode continuar estudando.");}finally{setBusy(false);}}}>
    <label htmlFor={`${id}-mode`}>Tipo de ajuda</label><select id={`${id}-mode`} value={mode} onChange={e=>setMode(e.target.value)}><option value="QUESTION_HELP">Começar</option><option value="SOCRATIC">Guiar o raciocínio</option><option value="EXPLAIN">Explicar</option><option value="REVIEW">Revisar</option></select>
    <label htmlFor={`${id}-message`}>Sua dúvida</label><textarea id={`${id}-message`} maxLength={1000} required value={message} onChange={e=>setMessage(e.target.value)}/><button disabled={busy} type="submit">{busy?"Consultando…":"Consultar tutor"}</button>
  </form>{text&&<p role="status">{text}</p>}</details>;
}
