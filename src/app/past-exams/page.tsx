import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { assessmentRepository } from "@/features/assessments/api";
import { formatDuration } from "@/features/assessments/labels";
import { buildPastExamCards,buildPastExamProgress,type PastExamCard } from "@/features/assessments/past-exam-cards";
import { AssessmentStartButton } from "@/features/assessments/start-button";
import { getOwnerId } from "@/features/auth/owner";
export const dynamic="force-dynamic";
const dateOnly=(value:string)=>value.split("-").reverse().join("/");
const localDate=(value:string)=>new Date(value).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"});
const plural=(count:number,one:string,many:string)=>`${count} ${count===1?one:many}`;
const stateLabel={FREE:"Livre",ACTIVE:"Em andamento",DONE:"Feita",RESERVED:"Reservada"} as const;
export default async function PastExamsPage({searchParams}:{searchParams:Promise<{year?:string}>}){
  const repo=assessmentRepository();const [templates,instances]=await Promise.all([repo.listTemplates(),repo.listSheetInstances(await getOwnerId())]);
  const cards=buildPastExamCards(templates,instances,new Date()),progress=buildPastExamProgress(templates,instances);
  const years=[...new Set(cards.map(card=>card.year))],{year}=await searchParams,selected=years.find(value=>String(value)===year);
  const verifiedAt=cards.map(card=>card.catalogVerifiedAt).sort().at(-1);
  return <AppShell><section className="foundation-panel past-exams" aria-labelledby="past-exams-title">
    <p className="eyebrow">IFSC · técnico integrado</p><h1 id="past-exams-title">Provas anteriores</h1>
    <p>Abra o caderno oficial, marque suas respostas no cartão e veja a correção quando finalizar.</p>
    {cards.length===0?<div className="empty-state"><strong>Nenhuma prova liberada ainda</strong><p>As provas anteriores aparecem aqui quando forem publicadas.</p></div>:<>
      <nav className="year-chips" aria-label="Filtrar por ano"><Link href="/past-exams" aria-current={selected?undefined:"page"}>Todas</Link>{years.map(value=><Link key={value} href={`/past-exams?year=${value}`} aria-current={selected===value?"page":undefined}>{value}</Link>)}</nav>
      {years.filter(value=>!selected||value===selected).map(value=><section key={value} className="module-section" aria-labelledby={`year-${value}`}><h2 id={`year-${value}`}>{value}</h2><ul className="assessment-grid">{cards.filter(card=>card.year===value).map(card=><PastExamCardView key={card.templateId} card={card}/>)}</ul></section>)}
    </>}
    {progress.length>0&&<section className="module-section" aria-labelledby="past-exam-progress"><h2 id="past-exam-progress">Sua evolução</h2><ol className="past-exam-progress">{progress.map(entry=><li key={entry.instanceId}><span>{entry.title}</span><progress className="bar" value={entry.correct} max={Math.max(entry.scored,1)} aria-hidden="true"/><strong>{entry.correct}/{entry.scored}</strong><small>{localDate(entry.startedAt)}</small></li>)}</ol></section>}
    <p className="past-exam-notice">Projeto independente, sem vínculo com o IFSC. Cadernos e gabaritos pertencem aos seus titulares; os links levam ao site oficial.{verifiedAt?` Catálogo conferido em ${dateOnly(verifiedAt)}.`:""}</p>
  </section></AppShell>;
}
function PastExamCardView({card}:{card:PastExamCard}){
  return <li className="assessment-card past-exam-card" data-state={card.state}>
    <span className="kind-chip">{stateLabel[card.state]}</span><h3>{card.title}</h3>
    <p className="assessment-meta"><span>Aplicada em {dateOnly(card.appliedOn)}</span><span>{card.itemCount} questões</span><span>{formatDuration(card.durationMinutes)}</span>{card.annulledCount>0&&<span>{plural(card.annulledCount,"anulada","anuladas")}</span>}</p>
    {card.subjects.length>0&&<p className="past-exam-subjects">{card.subjects.join(" · ")}</p>}
    {card.state==="RESERVED"?<p className="assessment-date">Simulado reservado: libera em {card.availableAt?localDate(card.availableAt):"data a definir"}</p>:<>
      {card.best&&<p>Melhor resultado: {card.best.correct}/{card.best.scored} · {plural(card.attempts,"tentativa","tentativas")}</p>}
      <div className="past-exam-actions">
        {card.examUrl&&<a className="past-exam-link" href={card.examUrl} target="_blank" rel="noopener noreferrer">Caderno oficial<ExternalLink aria-hidden="true" /><span className="visually-hidden"> (site oficial, abre em outra aba)</span></a>}
        {card.answerKeyUrl&&<a className="past-exam-link" href={card.answerKeyUrl} target="_blank" rel="noopener noreferrer">Gabarito oficial<ExternalLink aria-hidden="true" /><span className="visually-hidden"> (site oficial, abre em outra aba)</span></a>}
      </div>
      {card.state==="ACTIVE"?<Link className="primary-action" href={`/assessments/${card.activeInstanceId}`}>Continuar</Link>:<AssessmentStartButton templateId={card.templateId} label={card.state==="DONE"?"Refazer":"Responder"}/>}
    </>}
  </li>;
}
