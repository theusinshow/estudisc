"use client";
import { readValidatedResponse } from "@/lib/api-response";
import { compiledResponseSchema, generatedPreviewResponseSchema, importResponseSchema } from "../application/client-response-contracts";
import {Check,Clipboard,FileJson} from "lucide-react";
import {useId,useMemo,useState} from "react";
import {ImportResult,CompiledPrompt,ManualRecoveryDraft,GeneratedLessonPreview,readApiError,parseConceptLines} from './importer-shared';
import {GeneratedLessonPreviewPanel} from './generated-lesson-preview-panel';
import {ImportResultPanel} from './import-result-panel';

export function ManualGenerationPanel({ recovery }: Readonly<{ recovery: ManualRecoveryDraft | null }>) {
  const titleId = useId();
  const goalId = useId();
  const conceptsId = useId();
  const promptId = useId();
  const generatedId = useId();
  const [lessonTitle, setLessonTitle] = useState(recovery?.lessonTitle ?? "Funções em JavaScript");
  const [lessonGoal, setLessonGoal] = useState(
    recovery?.lessonGoal ?? "Ensinar como declarar e chamar funções simples."
  );
  const [conceptLines, setConceptLines] = useState(
    recovery?.conceptLines ?? "js-function | Função | Bloco reutilizável de lógica."
  );
  const [jobId, setJobId] = useState<string | null>(recovery?.jobId ?? null);
  const [compiledPrompt, setCompiledPrompt] = useState<CompiledPrompt | null>(recovery?.compiledPrompt ?? null);
  const [generatedJson, setGeneratedJson] = useState("");
  const [preview, setPreview] = useState<GeneratedLessonPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState(recovery?.message ?? "Configure a lição e compile o prompt.");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const importTarget = useMemo(
    () => ({
      packId: "generated.javascript.manual",
      version: 1,
      trackId: "generated-javascript",
      trackTitle: "JavaScript gerado",
      moduleId: "generated-basics",
      moduleTitle: "Fundamentos gerados"
    }),
    []
  );
  const canImportGenerated = Boolean(preview && generatedJson.trim() && !isBusy);

  function buildSpec() {
    return {
      targetSchema: "caderno.lesson.v1",
      language: "pt-BR",
      audienceLevel: "beginner",
      lessonTitle,
      lessonGoal,
      concepts: parseConceptLines(conceptLines),
      activityTypes: ["prediction", "code"],
      constraints: [
        "Use blocos curtos.",
        "Inclua pelo menos uma atividade de previsao antes da atividade de codigo.",
        "Nao inclua Markdown fora do JSON."
      ],
      importTarget
    };
  }

  async function compilePrompt() {
    setIsBusy(true);
    setError(null);
    setPreview(null);
    setImportResult(null);
    setMessage("Compilando prompt...");

    try {
      const response = await fetch("/api/generation/manual/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildSpec())
      });

      if (!response.ok) {
        setError(await readApiError(response));
        setMessage("Compilação bloqueada.");
        return;
      }

      const payload = await readValidatedResponse(response, compiledResponseSchema);
      setJobId(payload.jobId);
      setCompiledPrompt(payload.compiledPrompt);
      setMessage("Prompt compilado. Copie e cole a resposta JSON no campo abaixo.");
    } finally {
      setIsBusy(false);
    }
  }

  async function copyPrompt() {
    if (!compiledPrompt) {
      return;
    }

    await navigator.clipboard?.writeText(compiledPrompt.prompt);
    setMessage("Prompt copiado.");
  }

  async function validateGeneratedJson() {
    setIsBusy(true);
    setError(null);
    setPreview(null);
    setImportResult(null);
    setMessage("Validando JSON gerado...");

    try {
      const response = await fetch("/api/generation/lesson/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId, rawJson: generatedJson })
      });

      if (!response.ok) {
        setError(await readApiError(response));
        setMessage("Validação bloqueada.");
        return;
      }

      const payload = await readValidatedResponse(response, generatedPreviewResponseSchema);
      setPreview(payload);
      setMessage("JSON validado. Preview liberado para importação.");
    } finally {
      setIsBusy(false);
    }
  }

  async function importGeneratedLesson() {
    setIsBusy(true);
    setError(null);
    setMessage("Importando lição gerada...");

    try {
      const response = await fetch("/api/generation/lesson/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId, rawJson: generatedJson, importTarget })
      });

      if (!response.ok) {
        setError(await readApiError(response));
        setMessage(response.status === 409 ? "Conflito detectado. Nada foi aplicado." : "Importação bloqueada.");
        return;
      }

      const payload = await readValidatedResponse(response, importResponseSchema);
      setImportResult(payload);
      setMessage(payload.status === "already_imported" ? "Lição gerada já estava importada." : "Lição gerada importada.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="generation-panel" aria-labelledby="manual-generation-title">
      <div className="test-panel-header">
        <strong id="manual-generation-title">Manual / Copy Paste</strong>
        <span>{jobId ? "waiting_external_response" : "draft"}</span>
      </div>

      <div className="generation-form">
        <label>
          <span className="code-editor-label">Título</span>
          <input id={titleId} value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} />
        </label>
        <label>
          <span className="code-editor-label">Objetivo</span>
          <input id={goalId} value={lessonGoal} onChange={(event) => setLessonGoal(event.target.value)} />
        </label>
        <label className="generation-form-wide">
          <span className="code-editor-label">Conceitos</span>
          <textarea
            id={conceptsId}
            value={conceptLines}
            onChange={(event) => setConceptLines(event.target.value)}
            rows={3}
          />
        </label>
      </div>

      <div className="activity-actions">
        <button className="primary-action" type="button" onClick={() => void compilePrompt()} disabled={isBusy}>
          <FileJson aria-hidden="true" />
          Compilar prompt
        </button>
        <button className="secondary-action" type="button" onClick={() => void copyPrompt()} disabled={!compiledPrompt}>
          <Clipboard aria-hidden="true" />
          Copiar prompt
        </button>
      </div>

      {compiledPrompt ? (
        <>
          <label className="code-editor-label" htmlFor={promptId}>
            Prompt compilado
          </label>
          <textarea id={promptId} className="code-editor generation-prompt" readOnly value={compiledPrompt.prompt} />
        </>
      ) : null}

      <label className="code-editor-label" htmlFor={generatedId}>
        JSON gerado
      </label>
      <textarea
        id={generatedId}
        className="code-editor import-source"
        spellCheck={false}
        value={generatedJson}
        onChange={(event) => {
          setGeneratedJson(event.target.value);
          setPreview(null);
          setImportResult(null);
        }}
        placeholder={'{\n  "schema": "caderno.lesson.v1"\n}'}
      />

      <div className="activity-actions">
        <button className="secondary-action" type="button" onClick={() => void validateGeneratedJson()} disabled={isBusy}>
          <Check aria-hidden="true" />
          Validar
        </button>
        <button className="primary-action" type="button" onClick={() => void importGeneratedLesson()} disabled={!canImportGenerated}>
          Importar lição
        </button>
      </div>

      <p className="activity-status" role="status" aria-label="Estado da geração" aria-live="polite">
        {message}
      </p>

      {error ? (
        <div className="lesson-callout" data-variant="invalid" role="alert">
          <strong>Geração bloqueada.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      {preview ? <GeneratedLessonPreviewPanel preview={preview} /> : null}
      {importResult ? <ImportResultPanel result={importResult} /> : null}
    </section>
  );
}
