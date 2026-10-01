import Link from "next/link";
import { ArrowRight, Timer } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { assessmentRepository } from "@/features/assessments/api";
import { assessmentTemplateSchema } from "@/features/assessments/contracts";
import { assessmentKindLabel, formatDuration } from "@/features/assessments/labels";
import { AssessmentStartButton } from "@/features/assessments/start-button";
import { getOwnerId } from "@/features/auth/owner";
export const dynamic="force-dynamic";
export default async function AssessmentsPage(){
  const repo=assessmentRepository();const [templates,instances]=await Promise.all([repo.listTemplates(),repo.list(await getOwnerId())]);
  const finalized=instances.filter(instance=>instance.status==="FINALIZED");
  return <AppShell><section className="foundation-panel assessments" aria-labelledby="assessments-title">
    <p className="eyebrow">Treino no formato da prova</p><h1 id="assessments-title">Simulados</h1>
    <p>Tempo cronometrado e respostas editáveis até você finalizar. O resultado mostra o que estudar em seguida.</p>
    {instances.filter(instance=>instance.status==="ACTIVE").map(instance=><Link className="resume-card" key={instance.id} href={`/assessments/${instance.id}`}><span className="resume-icon"><Timer aria-hidden="true"/></span><span><strong>Simulado em andamento</strong><small>O cronômetro continua correndo</small></span><ArrowRight aria-hidden="true"/></Link>)}
    {templates.length===0?<div className="empty-state"><strong>Nenhum simulado liberado ainda</strong><p>Os simulados aparecem quando as questões forem revisadas e publicadas. Enquanto isso, estude pela tela Hoje.</p><Link className="primary-action" href="/">Ir para Hoje</Link></div>:
    <ul className="assessment-grid">{templates.map(row=>{const template=assessmentTemplateSchema.parse(row.definition);return <li key={row.id} className="assessment-card" data-kind={template.kind}>
      <span className="kind-chip">{assessmentKindLabel[template.kind]??template.kind}</span><h2>{template.title}</h2>
      <p className="assessment-meta"><span>{template.items.length} questões</span><span>{formatDuration(template.durationMinutes)}</span></p>
      {template.availableAt&&<p className="assessment-date">Liberado a partir de {new Date(template.availableAt).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})}</p>}
      <AssessmentStartButton templateId={row.id}/></li>;})}</ul>}
    {finalized.length>0&&<section className="module-section" aria-labelledby="history-title"><h2 id="history-title">Já feitos</h2><ol className="plain-rows">{finalized.map(instance=><li key={instance.id}><Link href={`/assessments/${instance.id}`}><span>Simulado de {instance.startedAt.toLocaleDateString("pt-BR")}</span><span>Ver resultado <ArrowRight aria-hidden="true"/></span></Link></li>)}</ol></section>}
  </section></AppShell>;
}
