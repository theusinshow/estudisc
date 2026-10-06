"use client";
import { readValidatedResponse } from "@/lib/api-response";
import { compiledResponseSchema, generatedResponseSchema, importResponseSchema } from "../application/client-response-contracts";
import {ArrowRightLeft,Clipboard,Eye,RefreshCcw} from "lucide-react";
import {useMemo,useState} from "react";
import {ImportResult,DeepSeekReadiness,GenerationUsage,ManualRecoveryDraft,GeneratedLessonPreview,formatEstimatedUsd,readApiErrorPayload,formatApiError,readApiError,DeepSeekFailure} from './importer-shared';
import {GeneratedLessonPreviewPanel} from './generated-lesson-preview-panel';
import {ImportResultPanel} from './import-result-panel';

export function DeepSeekGenerationPanel({
  deepSeek,
  onSwitchToManual
}: Readonly<{ deepSeek: DeepSeekReadiness; onSwitchToManual(recovery: ManualRecoveryDraft): void }>) {
  const [message, setMessage] = useState(
    deepSeek.status === "configured" ? "DeepSeek configurado. Gere a lição para validar." : "DeepSeek sem chave configurada."
  );
  const [error, setError] = useState<string | null>(null);
  const [rawJson, setRawJson] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedLessonPreview | null>(null);
  const [usage, setUsage] = useState<GenerationUsage | null>(null);
  const [manualFallback, setManualFallback] = useState<ManualRecoveryDraft | null>(null);
  const [failure, setFailure] = useState<DeepSeekFailure | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const lessonTitle = "Funções em JavaScript";
  const lessonGoal = "Ensinar como declarar e chamar funções simples.";
  const conceptLines = "js-function | Função | Bloco reutilizável de lógica.";
  const importTarget = useMemo(
    () => ({
      packId: "generated.javascript.deepseek",
      version: 1,
      trackId: "generated-javascript",
      trackTitle: "JavaScript gerado",
      moduleId: "generated-basics",
      moduleTitle: "Fundamentos gerados"
    }),
    []
  );

  function buildSpec() {
    return {
      targetSchema: "caderno.lesson.v1",
      language: "pt-BR",
      audienceLevel: "beginner",
      lessonTitle,
      lessonGoal,
      concepts: [{ id: "js-function", title: "Função", summary: "Bloco reutilizável de lógica." }],
      activityTypes: ["prediction", "code"],
      constraints: [
        "Use blocos curtos.",
        "Inclua pelo menos uma atividade de previsao antes da atividade de codigo.",
        "Nao inclua Markdown fora do JSON."
      ],
      importTarget
    };
  }

  async function compileManualFallback() {
    const response = await fetch("/api/generation/manual/compile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildSpec())
    });

    if (!response.ok) {
      setError(await readApiError(response));
      setMessage("Fallback manual bloqueado.");
      return null;
    }

    const payload = await readValidatedResponse(response, compiledResponseSchema);
    const recovery: ManualRecoveryDraft = {
      id: Date.now(),
      jobId: payload.jobId,
      compiledPrompt: payload.compiledPrompt,
      lessonTitle,
      lessonGoal,
      conceptLines,
      message: "Prompt preservado a partir da falha DeepSeek. Cole a resposta JSON no campo abaixo."
    };

    setManualFallback(recovery);
    return recovery;
  }

  async function generateWithDeepSeek() {
    setIsBusy(true);
    setError(null);
    setPreview(null);
    setUsage(null);
    setFailure(null);
    setShowTechnicalDetails(false);
    setImportResult(null);
    setMessage("Preparando fallback manual...");

    try {
      const recovery = await compileManualFallback();

      if (!recovery) {
        return;
      }

      setMessage("Gerando e validando com DeepSeek...");
      const response = await fetch("/api/generation/deepseek/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spec: buildSpec(), model: deepSeek.defaultModel })
      });

      if (!response.ok) {
        const payload = await readApiErrorPayload(response);
        const failureMessage = formatApiError(payload, "A geração DeepSeek não pôde ser concluída.");

        setError(failureMessage);
        setFailure({
          message: failureMessage,
          technicalDetails: {
            httpStatus: response.status,
            code: payload?.code,
            retryable: payload?.retryable,
            jobId: payload?.jobId,
            generationStatus: payload?.status,
            message: failureMessage
          }
        });
        setMessage("Geração direta bloqueada. Use Retry ou continue pelo Manual.");
        return;
      }

      const payload = await readValidatedResponse(response, generatedResponseSchema);
      setJobId(payload.jobId);
      setRawJson(payload.rawJson);
      setPreview(payload.preview);
      setUsage(payload.usage);
      setMessage("DeepSeek retornou JSON validado. Preview liberado para importação.");
    } catch {
      const failureMessage = "Geração direta falhou antes de receber resposta.";

      setError(failureMessage);
      setFailure({
        message: failureMessage,
        technicalDetails: {
          httpStatus: "network_error",
          message: failureMessage,
          retryable: true
        }
      });
      setMessage("Geração direta bloqueada. Use Retry ou continue pelo Manual.");
    } finally {
      setIsBusy(false);
    }
  }

  async function copyFallbackPrompt() {
    if (!manualFallback) {
      return;
    }

    await navigator.clipboard?.writeText(manualFallback.compiledPrompt.prompt);
    setMessage("Prompt de fallback copiado.");
  }

  function switchToManualFallback() {
    if (!manualFallback) {
      return;
    }

    onSwitchToManual(manualFallback);
  }

  async function importDeepSeekLesson() {
    setIsBusy(true);
    setError(null);
    setMessage("Importando lição gerada...");

    try {
      const response = await fetch("/api/generation/lesson/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId, rawJson, importTarget })
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
    <section className="generation-panel" aria-labelledby="deepseek-generation-title">
      <div className="test-panel-header">
        <strong id="deepseek-generation-title">AI / DeepSeek</strong>
        <span>{deepSeek.status === "configured" ? "configured" : "api_not_configured"}</span>
      </div>
      <div className="lesson-callout" data-variant={deepSeek.status === "configured" ? "concept" : "warning"}>
        <strong>{deepSeek.status === "configured" ? "Provedor disponível." : "STATUS API NOT CONFIGURED"}</strong>
        <span>
          Modelo padrão: {deepSeek.defaultModel}. Modelo avançado: {deepSeek.proModel}. A geração direta fica
          desabilitada enquanto a chave server-side não estiver configurada.
        </span>
      </div>
      <button
        className="primary-action"
        type="button"
        onClick={() => void generateWithDeepSeek()}
        disabled={deepSeek.status !== "configured" || isBusy}
      >
        Gerar com DeepSeek
      </button>
      {rawJson ? (
        <textarea className="code-editor generation-prompt" readOnly aria-label="JSON retornado pela DeepSeek" value={rawJson} />
      ) : null}
      {preview ? <GeneratedLessonPreviewPanel preview={preview} /> : null}
      {usage ? (
        <div className="lesson-callout" data-variant="concept" role="status" aria-label="Uso estimado da geração">
          <strong>Custo estimado: {formatEstimatedUsd(usage.estimatedCostUsd)}</strong>
          <span>
            Modelo: {usage.model}. Entrada: {usage.inputTokens ?? "Indisponível"} tokens. Saída:{" "}
            {usage.outputTokens ?? "Indisponível"} tokens. Cache hit: {usage.cacheHitTokens ?? 0} tokens.
          </span>
        </div>
      ) : null}
      {failure ? (
        <div className="lesson-callout" data-variant="invalid" role="alert" aria-label="Recuperação da geração DeepSeek">
          <strong>Geração direta bloqueada.</strong>
          <span>{failure.message}</span>
          <div className="activity-actions">
            <button className="secondary-action" type="button" onClick={() => void generateWithDeepSeek()} disabled={isBusy}>
              <RefreshCcw aria-hidden="true" />
              Retry
            </button>
            <button className="secondary-action" type="button" onClick={switchToManualFallback} disabled={!manualFallback}>
              <ArrowRightLeft aria-hidden="true" />
              Switch to Manual
            </button>
            <button className="secondary-action" type="button" onClick={() => void copyFallbackPrompt()} disabled={!manualFallback}>
              <Clipboard aria-hidden="true" />
              Copy Prompt
            </button>
            <button
              className="secondary-action"
              type="button"
              aria-expanded={showTechnicalDetails}
              onClick={() => setShowTechnicalDetails((current) => !current)}
            >
              <Eye aria-hidden="true" />
              View Technical Details
            </button>
          </div>
          {showTechnicalDetails ? (
            <textarea
              className="code-editor generation-prompt"
              readOnly
              aria-label="Detalhes técnicos da falha DeepSeek"
              value={JSON.stringify(failure.technicalDetails, null, 2)}
            />
          ) : null}
        </div>
      ) : null}
      <div className="activity-actions">
        <button
          className="primary-action"
          type="button"
          onClick={() => void importDeepSeekLesson()}
          disabled={!preview || isBusy}
        >
          Importar lição
        </button>
      </div>
      <p className="activity-status" role="status" aria-label="Estado da geração DeepSeek" aria-live="polite">
        {message}
      </p>
      {error && !failure ? (
        <div className="lesson-callout" data-variant="invalid" role="alert">
          <strong>Geração bloqueada.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      {importResult ? <ImportResultPanel result={importResult} /> : null}
    </section>
  );
}
