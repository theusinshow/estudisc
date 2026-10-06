"use client";

import {PreviewResult} from './importer-shared';


export function ImportPreview({ preview }: Readonly<{ preview: PreviewResult }>) {
  const blocked = preview.status === "conflict";

  return (
    <section className="import-preview" aria-labelledby="import-preview-title">
      <div className="test-panel-header">
        <strong id="import-preview-title">Preview</strong>
        <span>{preview.operation}</span>
      </div>
      <dl className="import-summary" aria-label="Resumo do Pack">
        <div>
          <dt>Pack</dt>
          <dd>
            {preview.packId} v{preview.version}
          </dd>
        </div>
        <div>
          <dt>Track</dt>
          <dd>{preview.summary.trackTitle}</dd>
        </div>
        <div>
          <dt>Conteúdo</dt>
          <dd>
            {preview.summary.moduleCount} módulo, {preview.summary.lessonCount} lição, {preview.summary.activityCount} atividades
          </dd>
        </div>
        <div>
          <dt>Conceitos</dt>
          <dd>{preview.summary.conceptCount}</dd>
        </div>
      </dl>
      {blocked ? (
        <div className="lesson-callout" data-variant="warning" role="alert">
          <strong>Conflito de mesma versão.</strong>
          <span>{preview.message}</span>
        </div>
      ) : null}
    </section>
  );
}
