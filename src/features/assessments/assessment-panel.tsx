"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentView } from "./api";
import { initialResponse,ResponseFields,type QuestionResponse } from "@/features/activities/components/response-fields";
import { QuestionAssets } from "@/features/questions/question-assets";
export function AssessmentPanel({view,serverNow}:{view:AssessmentView;serverNow:number}){
  const router=useRouter();const [now,setNow]=useState(serverNow);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [dirty,setDirty]=useState<Record<string,boolean>>({});
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  const remaining=Math.max(0,Math.ceil((Date.parse(view.deadlineAt)-now)/1000));const active=view.status==="ACTIVE"&&remaining>0;
  const pending=Object.values(dirty).some(Boolean);
  async function finish(){setBusy(true);setError("");try{const response=await fetch(`/api/assessments/${view.id}/finalize`,{method:"POST"});if(!response.ok)throw new Error("Não foi possível finalizar. As respostas salvas foram preservadas; tente novamente.");router.refresh();}catch(error){setError(error instanceof Error?error.message:"Falha ao finalizar.");}finally{setBusy(false);}}
  const hh=String(Math.floor(remaining/3600)),mm=String(Math.floor(remaining%3600/60)).padStart(2,"0"),ss=String(remaining%60).padStart(2,"0");
  return <div className="assessment-run">
    <div className="exam-timer" data-low={remaining<600} role="timer" aria-label="Tempo restante"><span>Tempo restante</span><strong>{hh}:{mm}:{ss}</strong><small>{view.questions.length} questões</small></div>
    <p className="assessment-note">Salve cada resposta. Dá para mudar até finalizar; o resultado aparece no fim.</p>
    {!active&&view.status==="ACTIVE"&&<p className="assessment-alert" role="alert">Tempo encerrado. Finalize para ver o resultado das respostas salvas.</p>}
    {view.questions.map((item,index)=><AssessmentQuestion key={item.versionId} item={item} initial={view.responses.find(response=>response.versionId===item.versionId)} assessmentId={view.id} index={index} disabled={!active||busy} onDirty={value=>setDirty(current=>({...current,[item.versionId]:value}))}/>)}
    <footer className="session-finish"><p>{pending&&active?"Salve as respostas alteradas antes de finalizar.":"Revisou tudo? Finalize para ver seu resultado."}</p><button className="primary-button" disabled={busy||active&&pending} onClick={()=>void finish()}>{busy?"Finalizando…":"Finalizar simulado"}</button>{error&&<p role="alert">{error}</p>}</footer>
  </div>;
}
function AssessmentQuestion({item,initial,assessmentId,index,disabled,onDirty}:{item:AssessmentView["questions"][number];initial?:AssessmentView["responses"][number];assessmentId:string;index:number;disabled:boolean;onDirty:(value:boolean)=>void}){
  const [response,setResponse]=useState<QuestionResponse>(()=>initial?.response===undefined?initialResponse(item.question):initial.response as QuestionResponse);const [flagged,setFlagged]=useState(initial?.flagged??false);const [busy,setBusy]=useState(false);const [status,setStatus]=useState(initial?"Resposta salva":"");
  const id=`assessment-${item.versionId}`;
  return <section className="learning-interaction exam-question" data-flagged={flagged} aria-labelledby={`${id}-title`}><span className="question-number" aria-hidden="true">{index+1}</span><h2 id={`${id}-title`}><span className="visually-hidden">Questão {index+1}. </span>{item.question.stem}</h2>{item.question.stimulus&&<p>{item.question.stimulus}</p>}<QuestionAssets assets={item.question.assets}/><form onSubmit={async event=>{event.preventDefault();setBusy(true);try{const result=await fetch(`/api/assessments/${assessmentId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({questionVersionId:item.versionId,response,flagged})});if(!result.ok)throw new Error();setStatus("Resposta salva");onDirty(false);}catch{setStatus("Resposta ainda não salva. Confira a conexão e tente novamente.");}finally{setBusy(false);}}}><ResponseFields question={item.question} id={id} response={response} disabled={disabled||busy} onChange={value=>{setResponse(value);setStatus("Resposta alterada; salve para registrar.");onDirty(true);}}/><label className="flag-toggle"><input type="checkbox" checked={flagged} disabled={disabled||busy} onChange={event=>{setFlagged(event.target.checked);onDirty(true);setStatus("Marcação alterada; salve para registrar.");}}/>Revisar depois</label><button className="primary-button" disabled={disabled||busy} type="submit">{busy?"Salvando…":"Salvar resposta"}</button><p className="save-status" role="status" data-saved={status==="Resposta salva"}>{status}</p></form></section>;
}
