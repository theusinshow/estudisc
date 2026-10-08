import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getOwnerId } from "@/features/auth/owner";
import { studySessionRepository } from "@/features/study-sessions/api";
import { SessionControls } from "@/features/study-sessions/session-controls";
import { getLesson } from "@/features/lessons/api";
import { LessonSteps } from "@/features/lessons/lesson-steps";
import { ActivityList } from "@/features/activities/registry";
import { getTodayDashboard } from "@/features/today/get-today-dashboard";
import { getLessonResume } from "@/features/lessons/resume-api";
import { LessonResumeProvider } from "@/features/lessons/resume-provider";
import { AiActionControl } from "@/features/ai/action-control";
export const dynamic="force-dynamic";
const statusLabel:Record<string,string>={PLANNED:"Pronta para começar",ACTIVE:"Em andamento",COMPLETED:"Concluída",ABANDONED:"Encerrada"};
export default async function StudyPage({params}:{params:Promise<{sessionId:string}>}){
  const {sessionId}=await params;if(!z.uuid().safeParse(sessionId).success)notFound();
  const result=await studySessionRepository().result(await getOwnerId(),sessionId);if(!result)notFound();
  const {session,items}=result;const completed=session.status==="COMPLETED";
  const next=completed?(await getTodayDashboard()).nextAction:undefined;
  return <AppShell mode={session.status === "ACTIVE" && getFeatureFlags().FEATURE_INTERACTIVE_LESSONS ? "focus" : "page"} exit={{ href: "/", label: "Voltar para Hoje" }}><article className="foundation-panel content-panel study-session" data-status={session.status}>
    <header className="study-header"><p className="eyebrow">Sessão de {session.budgetMinutes} min · {statusLabel[session.status]??session.status}</p><h1>{completed?"Seu estudo de hoje":"Vamos estudar"}</h1></header>
    {completed&&<section className="session-result" aria-label="Resultado da sessão"><p><strong>{result.answered} {result.answered===1?"questão respondida":"questões respondidas"}</strong> · {result.correct} {result.correct===1?"correta":"corretas"} · {result.attempts} {result.attempts===1?"tentativa":"tentativas"}.</p><p>Concluir registra sua participação. O domínio de cada conceito vem das suas respostas ao longo das revisões.</p><Link className="primary-action" href="/review">Conferir revisões</Link></section>}
    {completed&&<section className="session-facts" aria-label="Resumo factual"><p>{result.summary.plannedMinutes} min estimados de atividades · orçamento de {result.summary.budgetMinutes} min.</p>{result.summary.wallMinutes!==null&&<p>{Math.round(result.summary.wallMinutes)} min entre início e fim, incluindo pausas.</p>}
      {result.summary.independentConcepts.length>0&&<p>Prática independente registrada: {result.summary.independentConcepts.map(concept=>concept.title).join(" · ")}.</p>}
      {result.summary.reviewedConcepts>0&&<p>{result.summary.reviewedConcepts} conceito(s) com recuperação posterior registrada.</p>}
      {next&&<Link className="primary-action" href={next.href}>Próximo passo: {next.title}</Link>}</section>}
    {completed&&getFeatureFlags().FEATURE_AI_LEARNING&&<AiActionControl label="Resumir sessão com IA" spec={{action:"summarize_session",target:{kind:"session",sessionId:session.id}}}/>}
    {items.length>0&&<ol className="session-plan" aria-label="Roteiro da sessão">{items.map(item=><li key={JSON.stringify([item.trackId,item.lessonId,item.version])}><span>{item.title}{item.reason&&<small>{item.reason}</small>}</span><small>~{item.minutes} min</small></li>)}</ol>}
    {session.status!=="ACTIVE"&&<SessionControls sessionId={session.id} status={session.status} />}
    {session.status==="ACTIVE"&&await Promise.all(items.map(async item=>{const key=JSON.stringify([item.trackId,item.lessonId,item.version]);
      const resumeScope=getFeatureFlags().FEATURE_INTERACTIVE_LESSONS?{trackId:item.trackId??session.trackId,lessonId:item.lessonId,version:item.version,sessionId:session.id}:undefined;
      const resumeSnapshot=await getLessonResume(resumeScope);
      if(item.delivery==="questions"&&item.activitySnapshots){const body=<ActivityList activities={item.activitySnapshots.map(activity=>({...activity,studySessionId:session.id}))}/>;return <section className="session-lesson" key={key}><h2>{item.title}</h2><p>{item.reason}</p>{item.caveats?.map(caveat=><p className="learning-hint" key={caveat}>{caveat}</p>)}{resumeScope?<LessonResumeProvider scope={resumeScope} initial={resumeSnapshot}>{body}</LessonResumeProvider>:body}</section>;}
      const lesson=await getLesson(item.lessonId,item.version,item.trackId);return lesson?<section className="session-lesson" key={key}><h2>{lesson.title}</h2>{item.caveats?.map(caveat=><p className="learning-hint" key={caveat}>{caveat}</p>)}<LessonSteps blocks={lesson.blocks} activities={lesson.activities.filter(activity=>item.activityIds.includes(activity.stableId)).map(activity=>({...activity,studySessionId:session.id}))} resumeScope={resumeScope} resumeSnapshot={resumeSnapshot} /></section>:<p key={key}>Esta versão da aula está indisponível.</p>;}))}
    {session.status==="ACTIVE"&&<footer className="session-finish"><p>Terminou as atividades? Conclua para registrar a sessão.</p><SessionControls sessionId={session.id} status={session.status} /></footer>}
  </article></AppShell>;
}
