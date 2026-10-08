import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getConcept } from "@/features/concepts/api";
import { getFeatureFlags } from "@/lib/feature-flags";
import { listPublishedAiRelations } from "@/features/ai/concept-relations";
import { AiActionControl } from "@/features/ai/action-control";

type ConceptPageProps = Readonly<{
  params: Promise<{ conceptId: string }>;
}>;

export default async function ConceptPage({ params }: ConceptPageProps) {
  const { conceptId } = await params;
  const concept = await getConcept(conceptId);

  if (!concept) {
    notFound();
  }
  const relations=getFeatureFlags().FEATURE_AI_LEARNING?await listPublishedAiRelations(conceptId):[];

  return (
    <AppShell>
      <article className="foundation-panel content-panel accent-panel accent-learn" aria-labelledby="concept-title">
        <p className="eyebrow">Conceito</p>
        <h1 id="concept-title">{concept.title}</h1>
        <p>{concept.summary ?? "Sem resumo importado."}</p>
        {relations.length>0&&<section className="module-section" aria-label="Relações curriculares declaradas"><h2>Conceitos que ajudam aqui</h2><p>Estas relações vêm do currículo importado. A IA apenas explica a ligação.</p><ul className="record-list">{relations.map(edge=><li key={edge.prerequisiteConceptId}><div><Link href={`/concepts/${encodeURIComponent(edge.prerequisiteConceptId)}`}>{edge.title}</Link><span>{edge.strength==="required"?"Pré-requisito obrigatório":"Relação recomendada"}</span><AiActionControl label="Explicar esta ligação com IA" spec={{action:"explain_concept_relation",target:{kind:"relation",conceptId,relatedConceptId:edge.prerequisiteConceptId}}}/></div></li>)}</ul></section>}

        <section className="module-section" aria-labelledby="concept-lessons-title">
          <h2 id="concept-lessons-title">Onde aparece</h2>
          <ol className="record-list">
            {concept.lessons.map((lesson) => (
              <li key={lesson.stableId}>
                <Link href={`/lessons/${lesson.stableId}`}>
                  <strong>{lesson.title}</strong>
                  <span>{lesson.trackTitle}</span>
                  <small>{lesson.activityCount} atividade relacionada</small>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="module-section" aria-labelledby="concept-mastery-title">
          <h2 id="concept-mastery-title">Mastery</h2>
          <div className="mastery-panel" aria-label="Mastery do conceito">
            <p className="technical-label">POLICY {concept.mastery.policyVersion}</p>
            <p className="mastery-score">
              {concept.mastery.label} <span>{concept.mastery.level}/5</span>
            </p>
            <p className="lesson-text">
              {concept.mastery.evidenceCount} evidência registrada. Força total: {concept.mastery.totalStrength}.
            </p>
            <ul>
              {concept.mastery.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </section>
      </article>
    </AppShell>
  );
}
