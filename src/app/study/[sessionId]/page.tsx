import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { getOwnerId } from "@/features/auth/owner";
import { studySessionRepository } from "@/features/study-sessions/api";
import { SessionControls } from "@/features/study-sessions/session-controls";
import { getLesson } from "@/features/lessons/api";
import { LessonBlockList } from "@/features/lessons/blocks";
import { ActivityList } from "@/features/activities/registry";
export const dynamic="force-dynamic";
const statusLabel:Record<string,string>={PLANNED:"Pronta para começar",ACTIVE:"Em andamento",COMPLETED:"Concluída",ABANDONED:"Encerrada"};
export default async function StudyPage({params}:{params:Promise<{sessionId:string}>}){
  const {sessionId}=await params;if(!z.uuid().safeParse(sessionId).success)notFound();
  const result=await studySessionRepository().result(await getOwnerId(),sessionId);if(!result)notFound();
  const {session,items}=result;const completed=session.status==="COMPLETED";
  return <AppShell><article className="foundation-panel content-panel study-session" data-status={session.status}>
    <header className="study-header"><p className="eyebrow">Sessão de {session.budgetMinutes} min · {statusLabel[session.status]??session.status}</p><h1>{completed?"Seu estudo de hoje":"Vamos estudar"}</h1></header>
    {completed&&<section className="session-result" aria-label="Resultado da sessão"><p><strong>{result.answered} questões respondidas</strong> · {result.correct} corretas · {result.attempts} tentativas.</p><p>Concluir registra sua participação. O domínio de cada conceito vem das suas respostas ao longo das revisões.</p><Link className="primary-action" href="/review">Conferir revisões</Link></section>}
    {items.length>0&&<ol className="session-plan" aria-label="Roteiro da sessão">{items.map(item=><li key={item.lessonId}><span>{item.title}</span><small>{item.minutes} min</small></li>)}</ol>}
    {session.status!=="ACTIVE"&&<SessionControls sessionId={session.id} status={session.status} />}
    {session.status==="ACTIVE"&&await Promise.all(items.map(async item=>{const lesson=await getLesson(item.lessonId,item.version);return lesson?<section className="session-lesson" key={item.lessonId}><h2>{lesson.title}</h2><LessonBlockList blocks={lesson.blocks} /><ActivityList activities={lesson.activities.filter(activity=>item.activityIds.includes(activity.stableId)).map(activity=>({...activity,studySessionId:session.id}))} /></section>:<p key={item.lessonId}>Esta versão da aula está indisponível.</p>;}))}
    {session.status==="ACTIVE"&&<footer className="session-finish"><p>Terminou as atividades? Conclua para registrar a sessão.</p><SessionControls sessionId={session.id} status={session.status} /></footer>}
  </article></AppShell>;
}
