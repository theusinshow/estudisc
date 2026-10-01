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
export default async function StudyPage({params}:{params:Promise<{sessionId:string}>}){
  const {sessionId}=await params;if(!z.uuid().safeParse(sessionId).success)notFound();
  const result=await studySessionRepository().result(await getOwnerId(),sessionId);if(!result)notFound();
  const {session,items}=result;
  return <AppShell><article className="foundation-panel content-panel"><p className="eyebrow">Sessão · {session.budgetMinutes} min · {session.status}</p><h1>{session.status==="COMPLETED"?"Seu estudo de hoje":"Vamos estudar"}</h1>
    {session.status==="COMPLETED"&&<><p>{result.answered} questões respondidas · {result.correct} corretas · {result.attempts} tentativas.</p><p>Concluir a sessão registra sua participação. O domínio vem de evidências independentes e revisão.</p><Link href="/review">Conferir revisões</Link></>}
    <SessionControls sessionId={session.id} status={session.status} />
    {items.map(item=><p key={item.lessonId}>{item.title} · {item.minutes} min</p>)}
    {session.status==="ACTIVE"&&await Promise.all(items.map(async item=>{const lesson=await getLesson(item.lessonId,item.version);return lesson?<section key={item.lessonId}><h2>{lesson.title}</h2><LessonBlockList blocks={lesson.blocks} /><ActivityList activities={lesson.activities.filter(activity=>item.activityIds.includes(activity.stableId)).map(activity=>({...activity,studySessionId:session.id}))} /></section>:<p key={item.lessonId}>Esta versão da aula está indisponível.</p>;}))}
  </article></AppShell>;
}
