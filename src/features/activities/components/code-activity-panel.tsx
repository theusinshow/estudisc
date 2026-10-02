"use client";

import { CheckCircle2, Play, Terminal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { diffSourceLines } from "@/features/attempts/source-diff";
import { ATTEMPT_RECORDED_EVENT } from "@/features/progress/live-progress-summary";
import type { ActivityAttemptFeedback } from "@/features/activities/registry";

type RequestErrorExecutionPayload = Readonly<{
  status: "request_error";
  stdout: string[];
  stderr: string[];
}>;

type ExecutionPayload = ActivityAttemptFeedback["execution"] | RequestErrorExecutionPayload;

type SuccessfulExecutionPayload = ActivityAttemptFeedback["execution"];

type TestPayload = Readonly<{
  name: string;
  status: string;
  message: string;
}>;

type SubmissionPayload = Readonly<{
  attemptNumber: number;
  outcome: ActivityAttemptFeedback["outcome"];
  execution: ActivityAttemptFeedback["execution"];
  tests: ActivityAttemptFeedback["tests"];
}>;

type PostCodeResult =
  | Readonly<{ ok: true; body: Record<string, unknown> }>
  | Readonly<{ ok: false; message: string; statusCode?: number }>;

type CodeActivityPanelProps = Readonly<{
  activityStableId: string;
  activityLabel: string;
  prompt: string;
  starterCode: string;
  initialFeedback: ActivityAttemptFeedback | null;
}>;

export function CodeActivityPanel({
  activityStableId,
  activityLabel,
  prompt,
  starterCode,
  initialFeedback
}: CodeActivityPanelProps) {
  const [source, setSource] = useState(starterCode);
  const [execution, setExecution] = useState<ExecutionPayload | null>(initialFeedback?.execution ?? null);
  const [tests, setTests] = useState<TestPayload[]>(initialFeedback?.tests ?? []);
  const [latestFeedback, setLatestFeedback] = useState<ActivityAttemptFeedback | null>(initialFeedback);
  const [status, setStatus] = useState("Pronto");
  const [pendingAction, setPendingAction] = useState<"run" | "submit" | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(() => !initialFeedback);

  async function run() {
    if (pendingAction) {
      return;
    }

    try {
      setPendingAction("run");
      setDetailsOpen(true);
      setStatus("Executando RUN");
      setTests([]);
      const result = await postCode(`/api/activities/${activityStableId}/run`, source);

      if (!result.ok) {
        showRequestError("RUN", result);
        return;
      }

      const execution = normalizeExecutionPayload(result.body.execution);

      if (result.body.status === "executed" && execution) {
        setExecution(execution);
        setLatestFeedback(initialFeedback);
        setStatus("RUN concluído sem registrar tentativa");
        return;
      }

      setStatus("Não foi possível executar RUN");
    } finally {
      setPendingAction(null);
    }
  }

  async function submit() {
    if (pendingAction) {
      return;
    }

    try {
      setPendingAction("submit");
      setDetailsOpen(true);
      setStatus("Enviando solução");
      const result = await postCode(`/api/activities/${activityStableId}/submit`, source);

      if (!result.ok) {
        showRequestError("SUBMIT", result);
        return;
      }

      const submission = readSubmissionPayload(result.body);

      if (submission) {
        setExecution(submission.execution);
        setTests(submission.tests);
        setLatestFeedback({
          attemptNumber: submission.attemptNumber,
          outcome: submission.outcome,
          execution: submission.execution,
          tests: submission.tests,
          sourceDiff: diffSourceLines(starterCode, source),
          submittedAt: new Date().toISOString()
        });
        setStatus(`SUBMIT registrou tentativa ${submission.attemptNumber}`);
        window.dispatchEvent(new Event(ATTEMPT_RECORDED_EVENT));
        return;
      }

      setStatus("Não foi possível registrar SUBMIT");
    } finally {
      setPendingAction(null);
    }
  }

  function showRequestError(action: "RUN" | "SUBMIT", result: Extract<PostCodeResult, { ok: false }>) {
    const prefix = result.statusCode ? `${action} falhou (${result.statusCode})` : `${action} falhou`;

    setExecution({
      status: "request_error",
      stdout: [],
      stderr: [result.message]
    });
    setDetailsOpen(true);
    setStatus(prefix);
  }

  return (
    <section
      className="activity-panel"
      id={`activity-${activityStableId}`}
      aria-labelledby={`${activityStableId}-title`}
      aria-busy={pendingAction ? "true" : "false"}
    >
      <div>
        <p className="eyebrow">{activityLabel}</p>
        <h3 id={`${activityStableId}-title`}>{prompt}</h3>
      </div>

      <label className="code-editor-label" htmlFor={`${activityStableId}-source`}>
        Código
      </label>
      <textarea
        className="code-editor"
        id={`${activityStableId}-source`}
        spellCheck={false}
        value={source}
        onChange={(event) => setSource(event.target.value)}
      />

      <div className="activity-actions">
        <button type="button" className="secondary-action" onClick={run} disabled={pendingAction !== null}>
          <Play aria-hidden="true" />
          <span>RUN</span>
        </button>
        <button type="button" className="primary-action" onClick={submit} disabled={pendingAction !== null}>
          <CheckCircle2 aria-hidden="true" />
          <span>SUBMIT SOLUTION</span>
        </button>
      </div>

      <div className="activity-status" role="status" aria-live="polite">
        {status}
      </div>

      {latestFeedback ? (
        <div className="activity-feedback-row">
          <aside className="attempt-feedback" aria-label="Última tentativa">
            <p className="eyebrow">Última tentativa</p>
            <strong>
              Tentativa {latestFeedback.attemptNumber}: {latestFeedback.outcome}
            </strong>
            <span>{formatSubmittedAt(latestFeedback.submittedAt)}</span>
          </aside>
          <aside className="activity-next-step" aria-label="Próximo passo da atividade">
            <p className="eyebrow">Próximo passo</p>
            <strong>{latestFeedback.outcome === "passed" ? "Evidência registrada" : "Revisar antes de reenviar"}</strong>
            <span>
              {latestFeedback.outcome === "passed"
                ? "Confira progresso ou histórico sem perder esta aula."
                : "Use RUN para testar ajustes sem criar tentativa oficial."}
            </span>
            <div className="activity-next-links">
              <Link href="/progress">Progresso</Link>
              <Link href="/history">Histórico</Link>
            </div>
          </aside>
        </div>
      ) : null}

      <details
        className="activity-technical-details"
        open={detailsOpen}
        onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
      >
        <summary>
          <span>Terminal, testes e diff</span>
          <small>{getTechnicalSummary(execution, tests, latestFeedback)}</small>
        </summary>
        <div className="activity-technical-stack">
          <div className="terminal-panel" aria-label="Saída da execução">
            <div className="terminal-title">
              <Terminal aria-hidden="true" />
              <span>Terminal</span>
            </div>
            <ExecutionOutput execution={execution} />
          </div>

          {tests.length > 0 ? <TestResults tests={tests} /> : null}

          {latestFeedback?.sourceDiff.length ? <AttemptDiff lines={latestFeedback.sourceDiff} /> : null}
        </div>
      </details>
    </section>
  );
}

function ExecutionOutput({ execution }: Readonly<{ execution: ExecutionPayload | null }>) {
  if (!execution) {
    return <p>Nenhuma execução nesta sessão.</p>;
  }

  return (
    <div className="execution-output">
      <dl className="execution-meta" aria-label="Contrato da execução">
        <div>
          <dt>Status</dt>
          <dd>{execution.status}</dd>
        </div>
        {"runtimeVersion" in execution ? (
          <div>
            <dt>Runtime</dt>
            <dd>{execution.runtimeVersion}</dd>
          </div>
        ) : null}
        {"limits" in execution ? (
          <div>
            <dt>Limites</dt>
            <dd>
              {execution.limits.timeoutMs}ms / {execution.limits.outputLimit} chars
            </dd>
          </div>
        ) : null}
        {"capabilities" in execution ? (
          <div>
            <dt>Capacidades bloqueadas</dt>
            <dd>{formatBlockedCapabilities(execution.capabilities)}</dd>
          </div>
        ) : null}
      </dl>

      <TerminalStream label="STDOUT" lines={execution.stdout} />
      <TerminalStream label="STDERR" lines={execution.stderr} />
    </div>
  );
}

function TerminalStream({ label, lines }: Readonly<{ label: "STDOUT" | "STDERR"; lines: string[] }>) {
  return (
    <section className="terminal-stream" aria-label={label}>
      <strong>{label}</strong>
      {lines.length > 0 ? <pre>{lines.join("\n")}</pre> : <p>Sem saída.</p>}
    </section>
  );
}

function TestResults({ tests }: Readonly<{ tests: TestPayload[] }>) {
  const passed = tests.filter((test) => test.status === "passed").length;

  return (
    <section className="test-panel" aria-label="Resultados dos testes">
      <div className="test-panel-header">
        <strong>Testes</strong>
        <span>
          {passed}/{tests.length} passed
        </span>
      </div>
      <ol className="test-results">
        {tests.map((test) => (
          <li key={test.name} data-state={test.status}>
            <strong>{test.name}</strong>
            <span>
              {test.status}: {test.message}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AttemptDiff({ lines }: Readonly<{ lines: ActivityAttemptFeedback["sourceDiff"] }>) {
  return (
    <section className="attempt-diff" aria-label="Diff da tentativa">
      <div className="test-panel-header">
        <strong>Diff</strong>
        <span>{lines.filter((line) => line.type !== "unchanged").length} alteração</span>
      </div>
      <ol>
        {lines.map((line, index) => (
          <li key={`${line.type}-${index}`} data-state={line.type}>
            <span>{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}</span>
            <code>{line.text || " "}</code>
          </li>
        ))}
      </ol>
    </section>
  );
}

async function postCode(url: string, source: string): Promise<PostCodeResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ source })
    });
    const body = await readJsonBody(response);

    if (!response.ok) {
      return {
        ok: false,
        statusCode: response.status,
        message: readErrorMessage(body) ?? "A API recusou a execução. Tente novamente ou revise esta atividade."
      };
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {
        ok: false,
        statusCode: response.status,
        message: "A API respondeu em um formato inesperado."
      };
    }

    return { ok: true, body: body as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      message: "Não foi possível falar com a API local. Verifique se o servidor continua aberto."
    };
  }
}

async function readJsonBody(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function readErrorMessage(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const message = (body as { message?: unknown }).message;

  return typeof message === "string" && message.trim().length > 0 ? message : null;
}

function readSubmissionPayload(body: Record<string, unknown>): SubmissionPayload | null {
  if (body.status !== "submitted" || !body.evaluation || typeof body.evaluation !== "object") {
    return null;
  }

  const evaluation = body.evaluation as { execution?: unknown; tests?: unknown };
  const submission = body.submission as { attemptNumber?: unknown; outcome?: unknown } | undefined;

  const execution = normalizeExecutionPayload(evaluation.execution);

  if (!submission || !execution || !isTestPayloadArray(evaluation.tests)) {
    return null;
  }

  if (typeof submission.attemptNumber !== "number") {
    return null;
  }

  if (submission.outcome !== "passed" && submission.outcome !== "failed") {
    return null;
  }

  return {
    attemptNumber: submission.attemptNumber,
    outcome: submission.outcome,
    execution,
    tests: evaluation.tests
  };
}

function normalizeExecutionPayload(value: unknown): SuccessfulExecutionPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const execution = value as {
    status?: unknown;
    stdout?: unknown;
    stderr?: unknown;
    result?: unknown;
    runtimeVersion?: unknown;
    limits?: unknown;
    capabilities?: unknown;
  };

  if (
    isExecutionStatus(execution.status) &&
    Array.isArray(execution.stdout) &&
    execution.stdout.every((line) => typeof line === "string") &&
    Array.isArray(execution.stderr) &&
    execution.stderr.every((line) => typeof line === "string") &&
    typeof execution.runtimeVersion === "string" &&
    isExecutionLimits(execution.limits) &&
    isExecutionCapabilities(execution.capabilities)
  ) {
    return {
      status: execution.status,
      stdout: execution.stdout,
      stderr: execution.stderr,
      result: "result" in execution ? execution.result : null,
      runtimeVersion: execution.runtimeVersion,
      limits: execution.limits,
      capabilities: execution.capabilities
    };
  }

  return null;
}

function isTestPayloadArray(value: unknown): value is ActivityAttemptFeedback["tests"] {
  return Array.isArray(value) && value.every(isTestPayload);
}

function isTestPayload(value: unknown): value is ActivityAttemptFeedback["tests"][number] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const test = value as { name?: unknown; status?: unknown; message?: unknown };

  return (
    typeof test.name === "string" &&
    (test.status === "passed" || test.status === "failed") &&
    typeof test.message === "string"
  );
}

function isExecutionStatus(value: unknown): value is SuccessfulExecutionPayload["status"] {
  return value === "completed" || value === "runtime_error" || value === "timeout" || value === "output_limit_exceeded";
}

function isExecutionLimits(value: unknown): value is SuccessfulExecutionPayload["limits"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const limits = value as { timeoutMs?: unknown; outputLimit?: unknown };

  return typeof limits.timeoutMs === "number" && typeof limits.outputLimit === "number";
}

function isExecutionCapabilities(value: unknown): value is SuccessfulExecutionPayload["capabilities"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const capabilities = value as { dom?: unknown; network?: unknown; ambientSecrets?: unknown };

  return (
    typeof capabilities.dom === "boolean" &&
    typeof capabilities.network === "boolean" &&
    typeof capabilities.ambientSecrets === "boolean"
  );
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function getTechnicalSummary(
  execution: ExecutionPayload | null,
  tests: TestPayload[],
  latestFeedback: ActivityAttemptFeedback | null
) {
  if (tests.length > 0) {
    const passed = tests.filter((test) => test.status === "passed").length;

    return `${passed}/${tests.length} testes, tentativa ${latestFeedback?.attemptNumber ?? "local"}`;
  }

  if (execution) {
    return `Status ${execution.status}`;
  }

  return "Sem execução";
}

function formatBlockedCapabilities(capabilities: SuccessfulExecutionPayload["capabilities"]) {
  return [
    capabilities.dom ? null : "DOM",
    capabilities.network ? null : "network",
    capabilities.ambientSecrets ? null : "secrets"
  ]
    .filter(Boolean)
    .join(", ");
}
