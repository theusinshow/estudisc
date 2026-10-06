"use client";

import { useId, useState } from "react";

type RestorePreview = Readonly<{
  status: "ready";
  schema: "estudisc.restore-preview.v1";
  sourceExportedAt: string;
  applicationMode: "non_destructive_plan";
  categories: readonly { id: string; label: string; count: number; private: boolean }[];
  warnings: readonly string[];
  userStatePlan: {
    schema: "estudisc.user-state-restore-dry-run.v1";
    mode: "user_state_dry_run";
    sourceExportFingerprint: string;
    applyEnabled: false;
    categories: readonly {
      id: string;
      label: string;
      sourceCount: number;
      restoreStrategy: string;
      status: "empty" | "plan_only" | "blocked";
      reason: string;
    }[];
    blockers: readonly { code: string; message: string }[];
    warnings: readonly string[];
  };
}>;

type ApiError = Readonly<{
  code?: string;
  message?: string;
  issues?: readonly string[];
}>;

function parseJsonSource(source: string) {
  if (!source.trim()) {
    return { ok: false as const, message: "Cole um JSON Backup para pré-visualizar." };
  }

  try {
    return { ok: true as const, value: JSON.parse(source) as unknown };
  } catch {
    return { ok: false as const, message: "O conteúdo informado não é um JSON válido." };
  }
}

async function readApiError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiError | null;

  if (!payload) {
    return "A resposta do restore preview não pôde ser lida.";
  }

  if (payload.issues?.length) {
    return payload.issues.join(" ");
  }

  return payload.message ?? payload.code ?? "Preview de restore não concluído.";
}

export function RestorePreviewPanel() {
  const inputId = useId();
  const [source, setSource] = useState("");
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [message, setMessage] = useState("Nenhum Backup carregado.");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function previewSource() {
    setIsBusy(true);
    const parsed = parseJsonSource(source);

    if (!parsed.ok) {
      setPreview(null);
      setError(parsed.message);
      setMessage("Preview bloqueado.");
      setIsBusy(false);
      return;
    }

    try {
      setError(null);
      setMessage("Validando Backup...");

      const response = await fetch("/api/restore/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.value)
      });

      if (!response.ok) {
        setPreview(null);
        setError(await readApiError(response));
        setMessage("Preview bloqueado.");
        return;
      }

      const payload = (await response.json()) as RestorePreview;
      setPreview(payload);
      setMessage("Preview pronto. Estado do usuário permanece bloqueado para apply.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="module-section" aria-labelledby="restore-preview-title">
      <h2 id="restore-preview-title">Restore preview</h2>
      <p>Backup é validado sem aplicar tentativas, XP, histórico, erros, reviews ou gamificação.</p>

      <label className="code-editor-label" htmlFor={inputId}>
        JSON do Backup
      </label>
      <textarea
        id={inputId}
        className="code-editor import-source"
        spellCheck={false}
        value={source}
        onChange={(event) => {
          setSource(event.target.value);
          setPreview(null);
          setError(null);
          setMessage(event.target.value.trim() ? "Backup carregado. Execute o preview." : "Nenhum Backup carregado.");
        }}
        placeholder={'{\n  "schema": "estudisc.export.v1",\n  "kind": "backup"\n}'}
      />

      <div className="activity-actions">
        <button className="primary-action" type="button" onClick={() => void previewSource()} disabled={isBusy}>
          Preview
        </button>
      </div>

      <p className="activity-status" role="status" aria-label="Estado do restore preview" aria-live="polite">
        {message}
      </p>

      {error ? (
        <div className="lesson-callout" data-variant="invalid" role="alert">
          <strong>Restore bloqueado.</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {preview ? <RestorePreviewResult preview={preview} /> : null}
    </section>
  );
}

function RestorePreviewResult({ preview }: Readonly<{ preview: RestorePreview }>) {
  return (
    <section className="import-preview" aria-labelledby="restore-result-title">
      <div className="test-panel-header">
        <strong id="restore-result-title">Dry-run</strong>
        <span>apply blocked</span>
      </div>
      <dl className="import-summary" aria-label="Resumo do restore">
        <div>
          <dt>Export</dt>
          <dd>{preview.sourceExportedAt}</dd>
        </div>
        <div>
          <dt>Fingerprint</dt>
          <dd>{preview.userStatePlan.sourceExportFingerprint.slice(0, 12)}</dd>
        </div>
        <div>
          <dt>Modo</dt>
          <dd>{preview.applicationMode}</dd>
        </div>
      </dl>

      <ol className="record-list" aria-label="Plano de estado do usuário">
        {preview.userStatePlan.categories.map((category) => (
          <li key={category.id}>
            <div>
              <strong>{category.label}</strong>
              <span>
                {category.sourceCount} registro(s), {category.restoreStrategy}
              </span>
              <small>
                {category.status}: {category.reason}
              </small>
            </div>
          </li>
        ))}
      </ol>

      <div className="lesson-callout" data-variant="warning" role="status" aria-label="Bloqueadores do restore">
        <strong>Apply de estado bloqueado.</strong>
        <span>{preview.userStatePlan.blockers.map((blocker) => blocker.message).join(" ")}</span>
      </div>
    </section>
  );
}
