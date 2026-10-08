"use client";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { apiErrorSchema, readValidatedResponse } from "@/lib/api-response";
import { pedagogicalMistakeCategories, pedagogicalMistakeLabels, type PedagogicalMistakeCategory } from "./mistake-patterns";
const responseSchema=z.object({id:z.uuid(),basis:z.literal("student_report"),canonicalEvidence:z.literal(false)});
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function MistakeReflectionForm({mistakeId}:{mistakeId:string}){
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const id=useId(),router=useRouter(),mutation=useRef<string|null>(null);
  const [category,setCategory]=useState<PedagogicalMistakeCategory|"">(""),[note,setNote]=useState(""),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
  return <details className="activity-technical-details"><summary>Registrar minha percepção</summary><p>Você informa uma possível causa. Esta reflexão não altera domínio, notas ou agendamento da revisão.</p>
    <form className="learning-controls mistake-reflection-form" onSubmit={async event=>{
      event.preventDefault();setBusy(true);setStatus("");mutation.current??=crypto.randomUUID();
      try{
        const response=await fetch("/api/mistakes/reflection",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mistakeId,mutationId:mutation.current,category,note})});
        if(!response.ok){const failure=apiErrorSchema.safeParse(await response.json());throw new Error(failure.success?failure.data.message??"Não foi possível registrar a reflexão.":"Resposta inválida. Tente novamente.");}
        await readValidatedResponse(response,responseSchema);mutation.current=null;setStatus("Percepção registrada como relato seu, sem nova evidência de domínio.");router.refresh();
      }catch(error){setStatus(error instanceof Error?error.message:"Falha de conexão. Tente novamente.");}finally{setBusy(false);}
    }}>
      <label className="learning-field" htmlFor={`${id}-category`}>O que você percebeu?<select id={`${id}-category`} required value={category} disabled={!ready || busy} onChange={e=>{mutation.current=null;setCategory(e.target.value as PedagogicalMistakeCategory);}}><option value="" disabled>Escolha sua percepção</option>{pedagogicalMistakeCategories.map(key=><option key={key} value={key}>{pedagogicalMistakeLabels[key]}</option>)}</select></label>
      <label className="learning-field" htmlFor={`${id}-note`}>Anotação opcional<textarea id={`${id}-note`} maxLength={1000} value={note} disabled={!ready || busy} onChange={e=>{mutation.current=null;setNote(e.target.value);}}/></label>
      <button className="secondary-action" type="submit" disabled={!ready || busy}>{busy?"Registrando…":"Registrar percepção"}</button>
    </form>{status&&<p role="status">{status}</p>}
  </details>;
}
