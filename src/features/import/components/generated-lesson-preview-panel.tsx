"use client";

import {GeneratedLessonPreview} from './importer-shared';


export function GeneratedLessonPreviewPanel({ preview }: Readonly<{ preview: GeneratedLessonPreview }>) {
  return (
    <section className="import-preview" aria-labelledby="generated-preview-title">
      <div className="test-panel-header">
        <strong id="generated-preview-title">Preview da lição</strong>
        <span>{preview.operation}</span>
      </div>
      <dl className="import-summary" aria-label="Resumo da lição gerada">
        <div>
          <dt>Lição</dt>
          <dd>{preview.summary.lessonTitle}</dd>
        </div>
        <div>
          <dt>Stable ID</dt>
          <dd>{preview.summary.lessonStableId}</dd>
        </div>
        <div>
          <dt>Conteúdo</dt>
          <dd>
            {preview.summary.blockCount} blocos, {preview.summary.activityCount} atividades
          </dd>
        </div>
        <div>
          <dt>Conceitos</dt>
          <dd>{preview.summary.conceptCount}</dd>
        </div>
      </dl>
    </section>
  );
}
