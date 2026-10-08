import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { getDatabase,getDatabaseUrl } from "@/db/connection";
import { contentSources,contentQaReviews,questionVersions,questions,lessons,tracks } from "@/db/schema";
import { eq,desc } from "drizzle-orm";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { AdminActionPanel } from "@/features/content-qa/admin-action-panel";
import { getFeatureFlags } from "@/lib/feature-flags";
import { DrizzleCurriculumRepository } from "@/db/repositories/curriculum-repository";
export const dynamic="force-dynamic";
export default async function AdminPage(){try{await requireAdmin();}catch(error){if(error instanceof AccessDeniedError)notFound();throw error;}
  if(!getDatabaseUrl()||getDatabaseUrl()==="memory://local")return <main className="main-surface"><h1>Administração editorial</h1><p>Configure um PostgreSQL local para gerenciar publicação persistente. O modo de demonstração não aprova conteúdo.</p><Link href="/">Voltar ao estudo</Link></main>;
  const db=getDatabase();const [releases,sources,bank,lessonRows,trackRows,reviews]=await Promise.all([new ContentQaRepository(db).list(),db.select().from(contentSources),db.select({id:questions.stableId,version:questionVersions.version,status:questionVersions.status,content:questionVersions.content,subject:questionVersions.subjectCode,difficulty:questionVersions.difficulty}).from(questionVersions).innerJoin(questions,eq(questions.id,questionVersions.questionId)),db.select().from(lessons),db.select().from(tracks).orderBy(desc(tracks.contentVersion)),db.select().from(contentQaReviews)]);
  const track=trackRows[0];const coverage=track?await new DrizzleCurriculumRepository(db).getCoverage(track.id):null;
  return <div className="app-shell"><header className="topbar"><h1>Administração editorial</h1><Link href="/admin/review">Revisar aulas</Link><Link href="/">Abrir visão do aluno</Link></header><main className="main-surface"><nav className="learning-controls" aria-label="Áreas administrativas">{["curriculum","lessons","questions","sources","qa"].map(id=><a href={`#${id}`} key={id}>{({curriculum:"Currículo",lessons:"Aulas",questions:"Banco / provas",sources:"Fontes",qa:"QA"})[id as "qa"]}</a>)}<Link href="/assessments">Avaliações</Link>{getFeatureFlags().FEATURE_CONTENT_HEALTH ? <Link href="/admin/content-studio">Estúdio e saúde do conteúdo</Link> : null}</nav>
    <section id="curriculum" className="foundation-panel"><h2>Currículo</h2><p>Cobertura resulta de requisitos, conteúdo publicado e QA. Lacunas permanecem visíveis.</p><pre>{JSON.stringify(coverage?.summary??{message:"Nenhuma trilha importada"},null,2)}</pre>{coverage?.requirements.map(r=><details key={r.id}><summary>{r.id} · {r.state} · {r.label}</summary><p>Conceitos: {r.mappedConceptIds.join(", ")||"Não mapeado"}</p><p>Lacunas: {r.contentGaps.join(", ")}</p></details>)}</section>
    <section id="lessons" className="foundation-panel"><h2>Aulas e prévia</h2>{lessonRows.map(l=><p key={l.id}><Link href={`/lessons/${l.stableId}`}>{l.title}</Link> · v{l.contentVersion} · {String((l.metadata as Record<string,unknown>).status??"legado")}</p>)}</section>
    <section id="questions" className="foundation-panel"><h2>Banco e provas oficiais</h2><p>Gabaritos e imagens desta área são privados. Questões reservadas só entram na prova autorizada.</p>{bank.map(q=><details key={`${q.id}:${q.version}`}><summary>{q.subject} · {q.id} v{q.version} · {q.status} · {q.difficulty}</summary><pre>{JSON.stringify(q.content,null,2)}</pre></details>)}</section>
    <section id="sources" className="foundation-panel"><h2>Fontes</h2>{sources.map(s=><details key={s.id}><summary>{s.title}</summary><pre>{JSON.stringify({locator:s.locator,metadata:s.metadata},null,2)}</pre></details>)}</section>
    <section id="qa" className="foundation-panel"><h2>Fila de QA</h2>{releases.map(r=><details key={r.id}><summary>{r.stableId} v{r.version} · {r.status}</summary><p>ID: {r.id} · Autor: {r.authorId}</p><pre>{JSON.stringify(reviews.filter(review=>review.releaseId===r.id).map(({layer,verdict,rationale,findings})=>({layer,verdict,rationale,findings})),null,2)}</pre></details>)}</section>
    <AdminActionPanel/>
  </main></div>;
}
