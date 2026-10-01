import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { FirstRunCallout } from "@/components/ui/first-run-callout";
import { listKnowledgeMapConcepts } from "@/features/concepts/knowledge-map-api";

export const dynamic = "force-dynamic";

export default async function KnowledgeMapPage() {
  const concepts = await listKnowledgeMapConcepts();
  const focusedConcepts = concepts.slice(0, 12);
  const hiddenConceptCount = Math.max(concepts.length - focusedConcepts.length, 0);

  return (
    <AppShell>
      <section className="foundation-panel content-panel accent-panel accent-learn" aria-labelledby="knowledge-map-title">
        <p className="eyebrow">Mapa de conhecimento</p>
        <h1 id="knowledge-map-title">Mapa de conhecimento</h1>
        <p>Lista hierárquica completa dos conceitos importados. Esta versão não depende de canvas.</p>

        {concepts.length === 0 ? (
          <FirstRunCallout
            title="Mapa ainda vazio."
            description="O mapa é montado a partir dos conceitos das aulas importadas."
          />
        ) : (
          <div className="knowledge-map-sections">
            <section className="module-section" aria-labelledby="knowledge-map-focus-title">
              <h2 id="knowledge-map-focus-title">Conceitos em foco</h2>
              <p>Comece por este recorte antes de abrir o índice completo.</p>
              <ol className="record-list" aria-label="Conceitos em foco">
                {focusedConcepts.map((concept) => (
                  <li key={concept.stableId}>
                    <Link href={`/concepts/${concept.stableId}`}>
                      <strong>{concept.title}</strong>
                      <span>{concept.summary ?? "Sem resumo."}</span>
                      <small>{formatConceptScope(concept.lessonCount)}</small>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            <details className="module-section module-disclosure">
              <summary aria-labelledby="knowledge-map-index-title">
                <span className="technical-label">Índice</span>
                <h2 id="knowledge-map-index-title">Todos os conceitos</h2>
                <span>{hiddenConceptCount} restantes</span>
              </summary>
              <ol className="record-list" aria-label="Índice completo de conceitos">
                {concepts.map((concept) => (
                  <li key={concept.stableId}>
                    <Link href={`/concepts/${concept.stableId}`}>
                      <strong>{concept.title}</strong>
                      <span>{concept.summary ?? "Sem resumo."}</span>
                      <small>{formatConceptScope(concept.lessonCount)}</small>
                    </Link>
                  </li>
                ))}
              </ol>
            </details>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function formatConceptScope(lessonCount: number) {
  return `${lessonCount} ${lessonCount === 1 ? "lição vinculada" : "lições vinculadas"}`;
}
