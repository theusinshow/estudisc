"use client";
import { useId, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { BookOpen, Check, ChevronDown, Lightbulb, RotateCcw } from "lucide-react";
import type { StudentQuestion } from "@/features/questions/student-view";
import { initialResponse, ResponseFields,type QuestionResponse,type ResponseReview } from "./response-fields";
import type { AnswerKey, ItemResult } from "@/features/questions/answer-feedback";
import { QuestionAssets } from "@/features/questions/question-assets";
import { MathText, Paragraphs } from "@/components/ui/paragraphs";
import { TutorPanel } from "@/features/questions/tutor-panel";
import { ATTEMPT_RECORDED_EVENT, type AttemptRecordedDetail } from "@/features/progress/live-progress-summary";
import { useLessonResume } from "@/features/lessons/resume-provider";
import { usableDraft } from "@/features/lessons/resume-contracts";
import { draftResponseMatches } from "@/features/lessons/resume-policy";

type Feedback={correct:boolean;explanation?:string;attemptId?:string;xpAwarded?:number;reward?:"first_try"|"assisted";choiceFeedback?:string;itemResults?:ItemResult[];solutionShown?:boolean;answerKey?:AnswerKey};
/** Ordering marks are by position; matching and classification marks are by item. */
function reviewOf(question:StudentQuestion,feedback:Feedback|null):ResponseReview|undefined {
  if(!feedback)return undefined;
  const marks=feedback.correct?undefined:feedback.itemResults&&Object.fromEntries(feedback.itemResults.map((item,index)=>[question.type==="ordering"?`${index}`:item.itemId,item.correct]));
  return {marks,answerKey:feedback.answerKey};
}
/** What the student reads after a wrong answer: why the chosen option fails, or how many parts are right. */
function wrongMessage(feedback:Feedback) {
  if(feedback.choiceFeedback)return feedback.choiceFeedback;
  const parts=feedback.itemResults;
  if(parts?.length){const right=parts.filter(item=>item.correct).length;return `${right} de ${parts.length} ${parts.length===1?"parte está certa":"partes estão certas"}. Veja as marcadas com ✗.`;}
  return "Releia o enunciado e refaça a conta ou o raciocínio passo a passo.";
}
export function QuestionPanel({question,activityStableId,hintCount=0,sessionId,lastAnswer,lastAttempt,assistance,aiEnabled=false}:{question:StudentQuestion;activityStableId:string;hintCount?:number;sessionId?:string;aiEnabled?:boolean;lastAnswer?:unknown;lastAttempt?:{attemptId:string;submissionKey:string;correct:boolean;explanation?:string};assistance?:{hintLevel:number;hint:string;solutionRevealed:boolean;explanation?:string}}) {
  const resume=useLessonResume();
  const draft=usableDraft(resume?.data.drafts.find(entry=>entry.activityId===activityStableId&&entry.questionId===question.id&&entry.questionVersion===question.version&&draftResponseMatches(question.type,entry.response)),lastAttempt);
  const id=useId(); const [response,setResponse]=useState(()=>draft?.response??(lastAnswer==null||!draftResponseMatches(question.type,lastAnswer)?initialResponse(question):lastAnswer as QuestionResponse)); const [key,setKey]=useState(()=>draft?.submissionKey??crypto.randomUUID());
  const [baseAttemptId,setBaseAttemptId]=useState(lastAttempt?.attemptId??null);
  const [busy,setBusy]=useState(false); const [hintLevel,setHintLevel]=useState(assistance?.hintLevel??0); const [hint,setHint]=useState(assistance?.hint??""); const [hintOpen,setHintOpen]=useState(true);
  const [feedback,setFeedback]=useState<Feedback|null>(()=>{
    const revealed=assistance?.solutionRevealed?{correct:false,explanation:assistance.explanation}:null;
    return draft?revealed:lastAttempt??revealed;
  }); const [error,setError]=useState("");
  async function send(action:"submit"|"hint"|"solution") {
    setBusy(true);setError("");
    try {
      const result=await fetch(`/api/activities/${encodeURIComponent(activityStableId)}/question`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({questionId:question.id,questionVersion:question.version,action,response,submissionKey:key,sessionId})});
      if(!result.ok)throw new Error("Não foi possível registrar. Sua resposta foi preservada; tente novamente.");
      const body=await result.json();
      if(action==="hint"){setHintLevel(body.hintLevel);setHint(body.hint??"");setHintOpen(true);} else {setFeedback(body);if(body.attemptId){setBaseAttemptId(body.attemptId);resume?.setDraft(undefined,activityStableId);window.dispatchEvent(new CustomEvent<AttemptRecordedDetail>(ATTEMPT_RECORDED_EVENT,{detail:{questionId:question.id,stem:question.stem,correct:body.correct===true}}));}}
    } catch(error) {setError(error instanceof Error?error.message:"Falha ao registrar resposta.");} finally {setBusy(false);}
  }
  // Answer-sheet keys: A–E or 1–5 mark a choice while focus is inside this question (never inside a text field).
  function pickByKey(event:KeyboardEvent<HTMLElement>) {
    if(question.type!=="multiple_choice"||event.altKey||event.ctrlKey||event.metaKey||(event.target as HTMLElement).closest("textarea,select,input:not([type=radio])"))return;
    const letter="abcdefgh".indexOf(event.key.toLowerCase()), digit=/^[1-8]$/.test(event.key)?Number(event.key)-1:-1, index=event.key.length===1&&letter>=0?letter:digit;
    const radio=index>=0?event.currentTarget.querySelectorAll<HTMLInputElement>(".answer-row input[type=radio]")[index]:undefined;
    if(!radio||radio.disabled)return;
    event.preventDefault(); radio.click(); radio.focus();
  }
  const result=feedback?(feedback.attemptId?(feedback.correct?"correct":"incorrect"):"solution"):null;
  const solutionShown=result==="solution";
  return <section className="learning-interaction question-sheet" aria-labelledby={`${id}-title`} onKeyDown={pickByKey}>{question.stimulus&&<div className="question-stimulus"><Paragraphs text={question.stimulus}/></div>}<h3 id={`${id}-title`}><MathText text={question.stem}/></h3>
    <QuestionAssets assets={question.assets}/>
    <form onSubmit={event=>{event.preventDefault();void send("submit");}}><ResponseFields id={id} question={question} response={response} disabled={busy} review={reviewOf(question,feedback)} onChange={value=>{const submissionKey=crypto.randomUUID();setResponse(value);setFeedback(null);setKey(submissionKey);resume?.setDraft({activityId:activityStableId,questionId:question.id,questionVersion:question.version,response:value,submissionKey,baseAttemptId},activityStableId);}} /><button className="primary-button" disabled={busy||feedback?.correct===true} type="submit">{busy?"Registrando…":feedback?.correct?"Resposta registrada":"Enviar resposta"}</button></form>
    {/* The live wrapper exists before any answer, so screen readers announce the stamp when it appears. */}
    <div className="answer-result" aria-live="polite" aria-atomic="true">
      {feedback&&result&&<div role="status" aria-live="off" aria-label="Resultado da resposta" className="learning-feedback" data-result={result} key={feedback.attemptId??"solution"}>
        <span className="answer-stamp" data-result={result} aria-hidden="true">{result==="correct"?<Check/>:result==="incorrect"?<RotateCcw/>:<BookOpen/>}{result==="correct"?"Certo":result==="incorrect"?"Revise":"Solução"}</span>
        <strong>{feedback.attemptId?(feedback.correct?"Resposta correta":"Ainda não"):"Solução consultada"}</strong>
        {feedback.attemptId&&!feedback.correct&&<p><MathText text={wrongMessage(feedback)}/></p>}
        {(feedback.correct||!feedback.attemptId||feedback.solutionShown)&&feedback.explanation&&<p>{feedback.solutionShown&&<strong className="solution-label">Como resolver: </strong>}<MathText text={feedback.explanation}/></p>}
        {feedback.attemptId&&!feedback.correct&&<small>{feedback.solutionShown?"Leia a solução e tente de novo quando quiser. Este conceito entrou na sua revisão.":hintLevel<hintCount?"Tente de novo. Se travar, peça uma dica.":"Tente de novo. Este conceito entrou na sua revisão."}</small>}</div>}
    </div>
    {/* Progressive help: a hint first, the solution last. Each request is recorded as assistance, as before. */}
    <div className="question-aids">
      {hintLevel>0&&<div className="aid-disclosure" data-open={hintOpen||undefined}>
        <button type="button" className="aid-toggle" aria-expanded={hintOpen} aria-controls={`${id}-hint`} onClick={()=>setHintOpen(!hintOpen)}><Lightbulb aria-hidden="true"/>Dica {hintLevel} de {Math.max(hintCount,hintLevel)}<ChevronDown aria-hidden="true" className="aid-chevron"/></button>
        <aside className="learning-hint" id={`${id}-hint`} hidden={!hintOpen}><strong>Dica {hintLevel}</strong><p><MathText text={hint}/></p></aside>
      </div>}
      {hintLevel<hintCount&&<button type="button" className="aid-request" disabled={busy} onClick={()=>void send("hint")}><Lightbulb aria-hidden="true"/>{hintLevel>0?"Ver mais uma dica":"Ver uma dica"}</button>}
      {!solutionShown&&!feedback?.solutionShown&&<button type="button" className="aid-request" disabled={busy} onClick={()=>void send("solution")}><BookOpen aria-hidden="true"/>Ver solução</button>}
    </div>
    {feedback?.attemptId && feedback.correct && <div className="question-study-reward">
      {typeof feedback.xpAwarded === "number" && feedback.xpAwarded > 0 && <p role="status" aria-label="Recompensas de estudo"><strong>+{feedback.xpAwarded} XP</strong> · {feedback.reward==="assisted"?"Acertou depois de revisar.":"Acertou de primeira, sem ajuda."}</p>}
      <Link href="/achievements">Ver minhas conquistas</Link>
    </div>}
    {error&&<p role="alert">{error}</p>}
    {feedback&&<p className="question-report"><Link href={`/suporte?erro=${encodeURIComponent(`${question.id} v${question.version}`)}`}>Achou um erro nesta questão? Avise</Link></p>}
    <TutorPanel activityId={activityStableId} questionId={question.id} questionVersion={question.version} sessionId={sessionId} enhanced={aiEnabled}/>
  </section>;
}
