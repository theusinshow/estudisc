"use client";

import {ImportResult} from './importer-shared';


export function ImportResultPanel({ result }: Readonly<{ result: ImportResult }>) {
  return (
    <section className="lesson-callout" role="status" aria-labelledby="import-result-title">
      <strong id="import-result-title">{result.status === "already_imported" ? "Sem alteração." : result.lessonVersion ? "Versão da aula importada." : "Catálogo ativado."}</strong>
      <span>
        {result.status === "already_imported"
          ? `${result.packId} v${result.version} já estava importado.`
          : result.lessonVersion ? `${result.lessonId} v${result.lessonVersion} importada em rascunho na trilha existente. As versões anteriores foram preservadas.` : `${result.summary.trackStableId}: ${result.summary.importedLessons} lição e ${result.summary.importedActivities} atividades importadas.`}
      </span>
    </section>
  );
}
