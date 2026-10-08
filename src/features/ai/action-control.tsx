"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { z } from "zod";
import { aiLearningResponseSchema, type AiActionSpec } from "./contracts";
import { apiErrorSchema, readValidatedResponse } from "@/lib/api-response";

const subscribe=()=>()=>{},clientReady=()=>true,serverReady=()=>false;
const failureSchema=apiErrorSchema.extend({assisted:z.boolean().optional()});
export function AiActionControl({spec,label}:{spec:AiActionSpec;label:string}){
  const ready=useSyncExternalStore(subscribe,clientReady,serverReady);
  const scope=JSON.stringify(spec),controller=useRef<AbortController|null>(null),requestId=useRef<string|null>(null),lastScope=useRef(scope);
  const [state,setState]=useState<{scope:string;busy:boolean;error:string;assisted?:boolean;output?:{text:string;analogy?:string;example?:string}}>({scope,busy:false,error:""});
  useEffect(()=>()=>{controller.current?.abort();},[scope]);
  const current=state.scope===scope?state:{scope,busy:false,error:""};
  async function consult(){
    if(lastScope.current!==scope){requestId.current=null;lastScope.current=scope;}
    const active=new AbortController();controller.current=active;requestId.current??=crypto.randomUUID();
    setState({scope,busy:true,error:""});
    try{
      const response=await fetch("/api/ai/learning",{method:"POST",headers:{"Content-Type":"application/json"},signal:active.signal,body:JSON.stringify({...spec,requestId:requestId.current})});
      if(!response.ok){const error=failureSchema.safeParse(await response.json());throw Object.assign(new Error(error.success?error.data.message??"A consulta não está disponível. Continue pela explicação da aula.":"Não foi possível consultar. Tente novamente."),{assisted:error.success&&error.data.assisted===true});}
      const result=await readValidatedResponse(response,aiLearningResponseSchema).catch(()=>{throw new Error("A resposta da IA não pôde ser usada. Continue pela explicação da aula e tente novamente.");});
      if(controller.current===active)setState({scope,busy:false,error:"",assisted:result.assisted,output:{text:result.text,analogy:result.analogy,example:result.example}});
    }catch(error){if(controller.current===active)setState({scope,busy:false,assisted:error instanceof Error&&"assisted"in error&&error.assisted===true,error:active.signal.aborted?"Consulta cancelada. Você pode continuar estudando.":error instanceof SyntaxError?"Não foi possível ler a resposta. Continue pela aula e tente novamente.":error instanceof Error?error.message:"Falha de conexão. Continue estudando e tente novamente."});}
    finally{if(controller.current===active){requestId.current=null;controller.current=null;}}
  }
  return <div className="ai-action-control" role="group" aria-label={label} aria-busy={current.busy}>
    <div className="learning-controls"><button type="button" className="secondary-action" disabled={!ready||current.busy} aria-label={current.busy?`${label}: consulta em andamento`:label} onClick={()=>void consult()}>{current.busy?"Consultando…":label}</button>{current.busy&&<button type="button" className="secondary-action" aria-label={`Cancelar: ${label}`} onClick={()=>controller.current?.abort()}>Cancelar consulta</button>}</div>
    {current.error&&<p role="alert">{current.error}</p>}
    {current.assisted&&<p>Ajuda registrada nesta questão.</p>}
    {current.output&&<div className="learning-hint" role="status"><strong>Texto por IA · confira os dados e a referência</strong><p>{current.output.text}</p>{current.output.analogy&&<p>{current.output.analogy}</p>}{current.output.example&&<p>{current.output.example}</p>}</div>}
  </div>;
}
