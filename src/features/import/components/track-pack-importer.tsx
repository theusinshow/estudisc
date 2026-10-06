"use client";
import {BookOpen,Sparkles,Upload} from "lucide-react";
import {DeepSeekReadiness} from './importer-shared';
import {ManualGenerationPanel} from './manual-generation-panel';
import {DeepSeekGenerationPanel} from './deepseek-generation-panel';
import {ImportPreview} from './import-preview';
import {ImportResultPanel} from './import-result-panel';
import {useTrackPackImport} from "../hooks/use-track-pack-import";

export function TrackPackImporter({deepSeek}:Readonly<{deepSeek:DeepSeekReadiness}>){
const {inputId,fileId,studyWorkflowId,createWorkflowId,intent,setIntent,source,fileName,setFileName,preview,importResult,message,error,isBusy,mode,setMode,manualRecovery,setManualRecovery,canApply,resetResult,handlePreview,handleApply,handleExampleLoad,handleFileChange}=useTrackPackImport();
return (
    <div className="import-workspace">
      <section className="import-intent-panel" aria-labelledby="import-intent-title">
        <div className="test-panel-header">
          <strong id="import-intent-title">Escolha o fluxo</strong>
          <span>{intent === "study" ? "trilha pronta" : "criação"}</span>
        </div>
        <div className="import-intent-selector" role="group" aria-label="Fluxo de importação">
          <button
            className="import-intent-option"
            type="button"
            aria-pressed={intent === "study"}
            aria-controls={studyWorkflowId}
            onClick={() => setIntent("study")}
          >
            <BookOpen aria-hidden="true" />
            <span>
              <strong>Estudar trilha pronta</strong>
              <small>Importe um Track Pack validado e continue para a primeira aula.</small>
            </span>
          </button>
          <button
            className="import-intent-option"
            type="button"
            aria-pressed={intent === "create"}
            aria-controls={createWorkflowId}
            onClick={() => setIntent("create")}
          >
            <Sparkles aria-hidden="true" />
            <span>
              <strong>Criar aula com IA</strong>
              <small>Compile um prompt, valide o JSON gerado e importe uma lição.</small>
            </span>
          </button>
        </div>
      </section>

      <section id={studyWorkflowId} className="import-step-panel" aria-labelledby="direct-import-title" hidden={intent !== "study"}>
        <div className="test-panel-header">
          <strong id="direct-import-title">Ativar conteúdo existente</strong>
          <span>estudar hoje</span>
        </div>

        <p className="lesson-text">
          Caminho mais curto para estudar hoje: carregue o exemplo, execute o preview e aplique o catálogo validado.
        </p>

        <div className="import-actions" aria-label="Entrada do Pack">
          <button className="primary-action" type="button" onClick={handleExampleLoad} disabled={isBusy}>
            <Upload aria-hidden="true" />
            Carregar exemplo
          </button>
          <label className="secondary-action import-file-action" htmlFor={fileId}>
            Selecionar JSON
          </label>
          <input
            className="visually-hidden-file"
            id={fileId}
            type="file"
            accept="application/json,.json"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </div>

        <label className="code-editor-label" htmlFor={inputId}>
          JSON do Track Pack
        </label>
        <textarea
          id={inputId}
          className="code-editor import-source"
          spellCheck={false}
          value={source}
          onChange={(event) => {
            setFileName(null);
            resetResult(event.target.value);
          }}
          placeholder={'{\n  "schema": "caderno.track.v1"\n}'}
        />

        <div className="activity-actions">
          <button className="secondary-action" type="button" onClick={handlePreview} disabled={isBusy}>
            Preview
          </button>
          <button className="primary-action" type="button" onClick={handleApply} disabled={!canApply}>
            Aplicar
          </button>
        </div>

        <p className="activity-status" role="status" aria-label="Estado da importação" aria-live="polite">
          {fileName ? `${fileName}: ` : ""}
          {message}
        </p>

        {error ? (
          <div className="lesson-callout" data-variant="invalid" role="alert">
            <strong>Importação bloqueada.</strong>
            <span>{error}</span>
          </div>
        ) : null}

        {preview ? <ImportPreview preview={preview} /> : null}
        {importResult ? <ImportResultPanel result={importResult} /> : null}
      </section>

      <section id={createWorkflowId} className="generation-workflow" aria-labelledby="generation-workflow-title" hidden={intent !== "create"}>
        <div className="import-divider" role="separator" id="generation-workflow-title">
          Criar ou importar uma lição nova
        </div>

        <div className="generation-mode-selector" role="tablist" aria-label="Modo de geração">
          <button
            className={mode === "manual" ? "primary-action" : "secondary-action"}
            type="button"
            role="tab"
            aria-selected={mode === "manual"}
            onClick={() => setMode("manual")}
          >
            Manual / Copy Paste
          </button>
          <button
            className={mode === "deepseek" ? "primary-action" : "secondary-action"}
            type="button"
            role="tab"
            aria-selected={mode === "deepseek"}
            onClick={() => setMode("deepseek")}
          >
            AI / DeepSeek
          </button>
        </div>

        <div hidden={mode !== "manual"}>
          <ManualGenerationPanel key={manualRecovery?.id ?? "manual"} recovery={manualRecovery} />
        </div>
        <div hidden={mode !== "deepseek"}>
          <DeepSeekGenerationPanel
            deepSeek={deepSeek}
            onSwitchToManual={(recovery) => {
              setManualRecovery(recovery);
              setMode("manual");
              setIntent("create");
            }}
          />
        </div>
      </section>
    </div>
  );
}
