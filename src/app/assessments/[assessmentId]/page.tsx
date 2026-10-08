import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { getFeatureFlags } from "@/lib/feature-flags";
import { assessmentRepository } from "@/features/assessments/api";
import { AssessmentPanel } from "@/features/assessments/assessment-panel";
import { assessmentKindLabel, subjectLabel } from "@/features/assessments/labels";
import { getOwnerId } from "@/features/auth/owner";
import { summarizeAssessmentConcepts } from "@/features/assessments/result-summary";
import { listKnowledgeMapConcepts } from "@/features/concepts/knowledge-map-api";
export const dynamic="force-dynamic";
const resultSchema=z.object({correct:z.number(),scored:z.number(),total:z.number(),bySubject:z.record(z.string(),z.object({correct:z.number(),scored:z.number(),total:z.number(),annulled:z.number()})),items:z.array(z.object({questionId:z.string(),stem:z.string().optional(),correctAnswer:z.string().optional(),outcome:z.string(),explanation:z.string().optional(),conceptIds:z.array(z.string())}))});
const outcomeLabel=(outcome:string)=>outcome==="passed"?"Acertou":outcome==="annulled"?"Anulada":"Revisar";
export default async function AssessmentPage({params}:{params:Promise<{assessmentId:string}>}){
  const {assessmentId}=await params;if(!z.uuid().safeParse(assessmentId).success)notFound();
  const view=await assessmentRepository().view(await getOwnerId(),assessmentId);if(!view)notFound();
  const result=resultSchema.safeParse(view.result);
  const conceptScores=result.success&&getFeatureFlags().FEATURE_REAL_EXAM?summarizeAssessmentConcepts(result.data.items):[];
  const names=conceptScores.length?new Map((await listKnowledgeMapConcepts()).map(concept=>[concept.stableId,concept.title])):new Map<string,string>();
  return <AppShell mode={view.status === "ACTIVE" && getFeatureFlags().FEATURE_REAL_EXAM ? "focus" : "page"} exit={{ href: "/assessments", label: "Voltar aos simulados" }}><article className="foundation-panel content-panel assessment-page">
    <p className="eyebrow">{assessmentKindLabel[view.kind]??view.kind}{view.mode==="EXAM"?" · modo prova":""}</p>
    <h1>{view.status==="FINALIZED"?"Seu resultado":"Simulado"}</h1>
    {view.status==="ACTIVE"?<AssessmentPanel view={view} serverNow={view.serverNow} enhanced={getFeatureFlags().FEATURE_REAL_EXAM}/>:result.success?<>
      <section className="score-card" aria-label="Pontuação"><strong>{result.data.correct}<span>/{result.data.scored}</span></strong><p>questões pontuáveis corretas. Use isto para escolher o que estudar; não é uma previsão de aprovação.</p></section>
      <section className="module-section" aria-labelledby="by-subject"><h2 id="by-subject">Por área</h2><ul className="subject-bars">{Object.entries(result.data.bySubject).map(([subject,score])=><li key={subject} data-subject={subject}><span>{subjectLabel[subject]??subject}</span><progress className="bar" value={score.correct} max={Math.max(score.scored,1)} aria-hidden="true"/><strong>{score.correct}/{score.scored}</strong>{score.annulled?<small>{score.annulled} anulada(s)</small>:null}</li>)}</ul></section>
      {conceptScores.length>0&&<section className="module-section" aria-labelledby="exam-concepts"><h2 id="exam-concepts">Questões por conceito</h2><p>Este resumo mostra os resultados desta prova. Seu domínio considera as evidências ao longo dos estudos.</p><ul className="record-list">{conceptScores.map(score=><li key={score.conceptId}><div><Link href={`/concepts/${encodeURIComponent(score.conceptId)}`}>{names.get(score.conceptId)??score.conceptId}</Link><span>{score.correct}/{score.scored} questões pontuáveis corretas</span>{score.annulled>0&&<small>{score.annulled} questões anuladas</small>}</div></li>)}</ul></section>}
      <section className="module-section" aria-labelledby="review-items"><h2 id="review-items">Correção</h2><div className="review-items">{result.data.items.map((item,index)=><details key={item.questionId} data-outcome={item.outcome}><summary><span className="question-number">{index+1}</span><span className="summary-text"><strong>{outcomeLabel(item.outcome)}</strong>{item.stem&&<small>{item.stem}</small>}</span></summary><p>{item.stem}</p>{item.correctAnswer&&<p><strong>Resposta:</strong> {item.correctAnswer}</p>}<p>{item.explanation??"Confira a solução oficial ou o material aprovado."}</p></details>)}</div></section>
      <Link className="primary-action" href="/">Voltar para Hoje</Link>
    </>:<p>Resultado indisponível.</p>}
  </article></AppShell>;
}
