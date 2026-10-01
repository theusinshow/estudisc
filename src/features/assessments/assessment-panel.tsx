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
  return <><p><strong>Tempo restante: {Math.floor(remaining/3600)}h {Math.floor(remaining%3600/60)}min {remaining%60}s</strong></p><p>Respostas salvas podem ser alteradas até a finalização. O resultado aparece ao finalizar.</p>{!active&&view.status==="ACTIVE"&&<p role="alert">Tempo encerrado. Finalize para ver o resultado das respostas salvas.</p>}
    {view.questions.map((item,index)=><AssessmentQuestion key={item.versionId} item={item} initial={view.responses.find(response=>response.versionId===item.versionId)} assessmentId={view.id} index={index} disabled={!active||busy} onDirty={value=>setDirty(current=>({...current,[item.versionId]:value}))}/>)}
    <button className="primary-button" disabled={busy||active&&pending} onClick={()=>void finish()}>Finalizar avaliação</button>{pending&&active&&<p>Salve as respostas alteradas antes de finalizar.</p>}{error&&<p role="alert">{error}</p>}
  </>;
}
function AssessmentQuestion({item,initial,assessmentId,index,disabled,onDirty}:{item:AssessmentView["questions"][number];initial?:AssessmentView["responses"][number];assessmentId:string;index:number;disabled:boolean;onDirty:(value:boolean)=>void}){
  const [response,setResponse]=useState<QuestionResponse>(()=>initial?.response===undefined?initialResponse(item.question):initial.response as QuestionResponse);const [flagged,setFlagged]=useState(initial?.flagged??false);const [busy,setBusy]=useState(false);const [status,setStatus]=useState(initial?"Resposta salva":"");
  const id=`assessment-${item.versionId}`;
  return <section className="learning-interaction" aria-labelledby={`${id}-title`}><h2 id={`${id}-title`}>{index+1}. {item.question.stem}</h2>{item.question.stimulus&&<p>{item.question.stimulus}</p>}<QuestionAssets assets={item.question.assets}/><form onSubmit={async event=>{event.preventDefault();setBusy(true);try{const result=await fetch(`/api/assessments/${assessmentId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({questionVersionId:item.versionId,response,flagged})});if(!result.ok)throw new Error();setStatus("Resposta salva");onDirty(false);}catch{setStatus("Resposta ainda não salva. Confira a conexão e tente novamente.");}finally{setBusy(false);}}}><ResponseFields question={item.question} id={id} response={response} disabled={disabled||busy} onChange={value=>{setResponse(value);setStatus("Resposta alterada; salve para registrar.");onDirty(true);}}/><label className="learning-answer"><input type="checkbox" checked={flagged} disabled={disabled||busy} onChange={event=>{setFlagged(event.target.checked);onDirty(true);setStatus("Marcação alterada; salve para registrar.");}}/>Marcar para revisar antes de finalizar</label><button disabled={disabled||busy} type="submit">{busy?"Salvando…":"Salvar resposta"}</button><p role="status">{status}</p></form></section>;
}
