"use client";
import Link from "next/link";
import { createContext, useContext, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { openStudySession } from "./session-navigation";
import { apiErrorSchema, readValidatedResponse, sessionResponseSchema } from "@/lib/api-response";

/** `showTime={false}`: a card that starts a 10-minute practice without its own time choice; `ariaLabel` names a short label. */
type Props = ({ kind:"review";conceptId?:string;label?:string } | { kind:"remediation";mistakeId:string;label?:string }) & { showTime?:boolean;ariaLabel?:string };
/** One practice length for a whole page (Revisão, Erros): the picker sets it, every card or subject uses it. */
const PracticeMinutesContext = createContext<{ minutes: 10 | 15; setMinutes: (value: 10 | 15) => void } | null>(null);
export function PracticeMinutesProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [minutes, setMinutes] = useState<10 | 15>(10);
  return <PracticeMinutesContext.Provider value={{ minutes, setMinutes }}>{children}</PracticeMinutesContext.Provider>;
}
export function PracticeMinutesPicker({ label = "Tempo para cada prática" }: Readonly<{ label?: string }>) {
  const shared = useContext(PracticeMinutesContext);
  const id = useId();
  if (!shared) return null;
  return <label className="learning-field practice-minutes-picker" htmlFor={id}>{label}<select id={id} value={shared.minutes} onChange={event => shared.setMinutes(Number(event.target.value) as 10 | 15)}><option value={10}>10 minutos</option><option value={15}>15 minutos</option></select></label>;
}
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function TargetedPracticeControls(props:Props){
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const id=useId();const shared=useContext(PracticeMinutesContext);const [ownMinutes,setOwnMinutes]=useState<10|15>(10);const minutes=shared?.minutes??ownMinutes,setMinutes=shared?.setMinutes??setOwnMinutes;const [busy,setBusy]=useState(false),[error,setError]=useState(""),[locked,setLocked]=useState(false),[openSessionId,setOpenSessionId]=useState<string|null>(null);
  async function start(startNew=false){
    if(busy)return;setBusy(true);setError("");setOpenSessionId(null);
    try{
      const response=await fetch("/api/study-sessions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(props.kind==="review"?{action:"quick_review",budgetMinutes:minutes,conceptId:props.conceptId,...(startNew?{startNew:true}:{})}:{action:"practice_mistake",budgetMinutes:minutes,mistakeId:props.mistakeId,...(startNew?{startNew:true}:{})})});
      if(!response.ok){const body:unknown=await response.json();
        // Another session is open: the learner decides; nothing is reused or discarded silently.
        if(typeof body==="object"&&body!==null&&(body as {code?:unknown}).code==="session_open"&&typeof (body as {sessionId?:unknown}).sessionId==="string"){setOpenSessionId((body as {sessionId:string}).sessionId);setBusy(false);return;}
        const failure=apiErrorSchema.safeParse(body);setLocked(failure.success&&failure.data.code==="paid_access_required");throw new Error(failure.success?failure.data.message??"Esta prática não está disponível agora.":"Não foi possível preparar a prática. Tente novamente.");}
      const result=await readValidatedResponse(response,sessionResponseSchema);openStudySession(result.sessionId);
    }catch(failure){setError(failure instanceof Error?failure.message:"Falha de conexão. Você pode tentar novamente.");setBusy(false);}
  }
  return <div className="learning-controls targeted-practice-controls" aria-busy={busy}>
    {!ready&&<p role="status">Carregando controles da sessão…</p>}
    {props.showTime!==false&&<label className="learning-field" htmlFor={`${id}-minutes`}>Tempo para esta prática<select id={`${id}-minutes`} value={minutes} disabled={!ready || busy} onChange={event=>setMinutes(Number(event.target.value) as 10|15)}><option value={10}>10 minutos</option><option value={15}>15 minutos</option></select></label>}
    <button className="primary-button" type="button" aria-label={busy?undefined:props.ariaLabel} disabled={!ready || busy} onClick={()=>void start(false)}>{busy?"Preparando…":props.label??(props.kind==="review"?"Revisão rápida":"Praticar outra questão")}</button>
    {openSessionId&&<div role="group" aria-label="Sessão em andamento" className="learning-controls"><p role="status">Você tem uma sessão de estudo em andamento. Quer continuar nela ou começar esta prática do zero?</p><button className="secondary-action" type="button" onClick={()=>openStudySession(openSessionId)}>Continuar a sessão</button><button className="primary-button" type="button" disabled={busy} onClick={()=>void start(true)}>Começar esta prática</button></div>}
    {busy&&<p role="status">Abrindo sessão…</p>}{error&&<p role="alert">{error}{locked&&<> <Link href="/upgrade">Ver acesso completo</Link></>}</p>}
  </div>;
}
