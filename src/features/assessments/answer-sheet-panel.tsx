"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { assessmentSavedResponseSchema,readValidatedResponse } from "@/lib/api-response";
import { sheetLetters,sheetResultSchema,type SheetAnswer } from "./sheet-contracts";
import type { SheetView } from "./sheet-view";
type Row={answer:SheetAnswer;flagged:boolean;saving:boolean;failed:boolean};
const milestones=[30,10,5,1];
// ADR 0066: answer sheet for a past exam. The booklet stays on the official site; nothing is corrected before finalization.
export function AnswerSheetPanel({view}:{view:SheetView}){
  const router=useRouter(),[now,setNow]=useState(view.serverNow),[confirming,setConfirming]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [rows,setRows]=useState<Record<number,Row>>(()=>Object.fromEntries(view.items.map(item=>{const saved=view.responses.find(row=>row.position===item.position);return [item.position,{answer:saved?.answer??null,flagged:saved?.flagged??false,saving:false,failed:false}];})));
  useEffect(()=>{const start=performance.now();const timer=setInterval(()=>setNow(view.serverNow+performance.now()-start),1000);return()=>clearInterval(timer);},[view.serverNow]);
  const remaining=Math.max(0,Math.ceil((Date.parse(view.deadlineAt)-now)/1000)),open=remaining>0,milestone=milestones.filter(value=>remaining<=value*60).at(-1);
  const hh=String(Math.floor(remaining/3600)),mm=String(Math.floor(remaining%3600/60)).padStart(2,"0"),ss=String(remaining%60).padStart(2,"0");
  const list=view.items.map(item=>[item.position,rows[item.position]] as const),answered=list.filter(([,row])=>row.answer!==null).length,pending=list.some(([,row])=>row.saving);
  const blank=list.filter(([,row])=>row.answer===null).map(([position])=>position),flagged=list.filter(([,row])=>row.flagged).map(([position])=>position);
  const sections=view.subjects.length?view.subjects.map(subject=>({name:subject.name,items:view.items.filter(item=>item.position>=subject.start&&item.position<=subject.end)})):[{name:"",items:view.items}];
  async function save(position:number,next:{answer:SheetAnswer;flagged:boolean}){
    setRows(current=>({...current,[position]:{...next,saving:true,failed:false}}));
    try{const response=await fetch(`/api/assessments/${view.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({position,...next})});if(!response.ok)throw new Error("save");await readValidatedResponse(response,assessmentSavedResponseSchema);setRows(current=>({...current,[position]:{...current[position],saving:false}}));}
    catch{setRows(current=>({...current,[position]:{...current[position],saving:false,failed:true}}));}
  }
  async function finish(){setBusy(true);setError("");try{const response=await fetch(`/api/assessments/${view.id}/finalize`,{method:"POST"});if(!response.ok)throw new Error("Não foi possível finalizar. As respostas salvas foram preservadas; tente novamente.");await readValidatedResponse(response,sheetResultSchema);router.refresh();}catch(error){setError(error instanceof Error?error.message:"Falha ao finalizar.");}finally{setBusy(false);}}
  return <div className="answer-sheet">
    <header className="answer-sheet-bar">
      <p className="answer-sheet-timer"><span className="visually-hidden">Tempo restante: </span><strong>{hh}:{mm}:{ss}</strong></p>
      <p>{answered}/{view.items.length} respondidas</p>
      <a className="past-exam-link" href={view.links.examUrl} target="_blank" rel="noopener noreferrer">Abrir caderno oficial</a>
      <p className="visually-hidden" aria-live="polite">{milestone?`Restam ${milestone} minutos de prova.`:""}</p>
    </header>
    {!open&&<p role="status" className="answer-sheet-closed">Tempo esgotado. Finalize para ver o resultado; as respostas salvas foram preservadas.</p>}
    {sections.map(section=><section key={section.name||"all"} className="answer-sheet-section" aria-label={section.name||"Cartão-resposta"}>
      {section.name&&<h2>{section.name}</h2>}
      <ol className="answer-sheet-rows">{section.items.map(item=>{const row=rows[item.position];return <li key={item.position} data-flagged={row.flagged||undefined}>
        <fieldset disabled={!open}><legend>Questão {item.position}</legend>
          <div className="answer-sheet-letters">{sheetLetters.map(letter=><label key={letter}><input type="radio" name={`q-${item.position}`} value={letter} checked={row.answer===letter} onChange={()=>save(item.position,{answer:letter,flagged:row.flagged})} aria-label={`Questão ${item.position}, alternativa ${letter}`}/><span aria-hidden="true">{letter}</span></label>)}</div>
          <div className="answer-sheet-tools">
            <button type="button" className="text-button" disabled={row.answer===null} onClick={()=>save(item.position,{answer:null,flagged:row.flagged})} aria-label={`Limpar questão ${item.position}`}>Limpar</button>
            <label className="answer-sheet-flag"><input type="checkbox" checked={row.flagged} onChange={event=>save(item.position,{answer:row.answer,flagged:event.target.checked})} aria-label={`Revisar questão ${item.position} depois`}/><span aria-hidden="true">Revisar depois</span></label>
            {row.saving?<small>Salvando…</small>:row.failed?<small role="alert">Não salvou. Marque de novo.</small>:null}
          </div>
        </fieldset></li>;})}</ol>
    </section>)}
    <footer className="answer-sheet-finish">
      {!confirming?<button className="primary-button" type="button" disabled={pending||busy} onClick={()=>setConfirming(true)}>Conferir e finalizar</button>:<section aria-labelledby="finish-title">
        <h2 id="finish-title">Finalizar a prova?</h2>
        <p>{blank.length?`Em branco: ${blank.join(", ")}.`:"Todas as questões têm resposta."}</p>
        {flagged.length>0&&<p>Marcadas para revisar: {flagged.join(", ")}.</p>}
        <p>Depois de finalizar, as respostas não podem mais ser alteradas.</p>
        <div className="answer-sheet-confirm"><button className="primary-button" type="button" disabled={pending||busy} onClick={finish}>{busy?"Corrigindo…":"Finalizar prova"}</button><button className="text-button" type="button" onClick={()=>setConfirming(false)}>Voltar ao cartão</button></div>
      </section>}
      {error&&<p role="alert">{error}</p>}
    </footer>
  </div>;
}
