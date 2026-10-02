"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { qaLayers } from "./policy";

type Layer = (typeof qaLayers)[number];
type Severity = "" | "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type LayerState = { verdict: "APPROVE" | "REJECT"; rationale: string; severity: Severity; finding: string; override: string };

const layerCopy: Record<Layer, { title: string; check: string }> = {
  STRUCTURAL: { title: "Estrutura", check: "A aula abre sem blocos quebrados, cada conceito tem ensino e questões, as figuras têm descrição e o desafio final existe." },
  FACTUAL: { title: "Fatos", check: "Refiz as contas, conferi datas, nomes e definições, e cada gabarito está certo com uma única alternativa defensável." },
  PEDAGOGICAL: { title: "Pedagogia", check: "A explicação é clara para o 9º ano, os exemplos ajudam, as dicas não entregam a resposta e o tamanho da aula é razoável." },
  IFSC_ALIGNMENT: { title: "Alinhamento ao IFSC", check: "O conteúdo corresponde ao edital (Anexo V) e as questões parecem com o estilo da prova." }
};

const MIN_RATIONALE = 20;
const blank = (): LayerState => ({ verdict: "APPROVE", rationale: "", severity: "", finding: "", override: "" });

/** The owner's four-layer decision for a lesson and its questions (ADR 0033). Nothing is prefilled: the rationale is the reviewer's own. */
export function LessonReviewForm({ lessonId, version, questionCount }: Readonly<{ lessonId: string; version: number; questionCount: number }>) {
  const router = useRouter();
  const [layers, setLayers] = useState<Record<Layer, LayerState>>(() => Object.fromEntries(qaLayers.map((layer) => [layer, blank()])) as Record<Layer, LayerState>);
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const update = (layer: Layer, patch: Partial<LayerState>) => setLayers((current) => ({ ...current, [layer]: { ...current[layer], ...patch } }));
  const anyReject = qaLayers.some((layer) => layers[layer].verdict === "REJECT");
  const incomplete = qaLayers.filter((layer) => layers[layer].rationale.trim().length < MIN_RATIONALE || (layers[layer].severity && !layers[layer].finding.trim()) || (layers[layer].severity === "MEDIUM" && layers[layer].verdict === "APPROVE" && layers[layer].override.trim().length < MIN_RATIONALE));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (incomplete.length) return;
    setBusy(true);
    setMessage(null);
    const reviews = qaLayers.map((layer) => {
      const state = layers[layer];
      const findings = state.severity ? [{ severity: state.severity, message: state.finding.trim(), ...(state.severity === "MEDIUM" && state.override.trim() ? { editorialOverrideReason: state.override.trim() } : {}) }] : [];
      return { layer, verdict: state.verdict, rationale: state.rationale.trim(), findings };
    });
    try {
      const response = await fetch("/api/admin/content-qa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "review_lesson", lessonId, version, reviews, publish: publish && !anyReject }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message ?? "A revisão não foi registrada.");
      setMessage({ kind: "ok", text: publish && !anyReject ? `Revisão registrada e aula publicada com ${questionCount} questões.` : "Revisão registrada. A aula continua em rascunho." });
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: `Nada foi alterado: ${error instanceof Error ? error.message : "falha ao registrar."}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="editorial-form" onSubmit={submit} aria-busy={busy}>
      {qaLayers.map((layer) => {
        const state = layers[layer];
        const id = `layer-${layer}`;
        return (
          <fieldset key={layer} className="editorial-layer" data-verdict={state.verdict}>
            <legend>{layerCopy[layer].title}</legend>
            <p className="editorial-check">{layerCopy[layer].check}</p>
            <div className="editorial-verdict" role="radiogroup" aria-label={`Decisão: ${layerCopy[layer].title}`}>
              {(["APPROVE", "REJECT"] as const).map((verdict) => (
                <label key={verdict}>
                  <input type="radio" name={`${id}-verdict`} checked={state.verdict === verdict} onChange={() => update(layer, { verdict })} />
                  {verdict === "APPROVE" ? "Aprovo" : "Reprovo"}
                </label>
              ))}
            </div>
            <label className="editorial-field">
              O que você conferiu (mínimo {MIN_RATIONALE} caracteres)
              <textarea value={state.rationale} onChange={(event) => update(layer, { rationale: event.target.value })} rows={3} required minLength={MIN_RATIONALE} />
            </label>
            <label className="editorial-field">
              Achado (opcional)
              <select value={state.severity} onChange={(event) => update(layer, { severity: event.target.value as Severity })}>
                <option value="">Nenhum</option>
                <option value="INFO">Informativo</option>
                <option value="LOW">Baixo</option>
                <option value="MEDIUM">Médio</option>
                <option value="HIGH">Alto (bloqueia)</option>
                <option value="CRITICAL">Crítico (bloqueia)</option>
              </select>
            </label>
            {state.severity ? (
              <label className="editorial-field">
                Descreva o achado
                <textarea value={state.finding} onChange={(event) => update(layer, { finding: event.target.value })} rows={2} required />
              </label>
            ) : null}
            {state.severity === "MEDIUM" && state.verdict === "APPROVE" ? (
              <label className="editorial-field">
                Por que aceitar mesmo assim (mínimo {MIN_RATIONALE} caracteres)
                <textarea value={state.override} onChange={(event) => update(layer, { override: event.target.value })} rows={2} required minLength={MIN_RATIONALE} />
              </label>
            ) : null}
          </fieldset>
        );
      })}

      <label className="editorial-publish">
        <input type="checkbox" checked={publish && !anyReject} disabled={anyReject} onChange={(event) => setPublish(event.target.checked)} />
        <span>Publicar a aula e as {questionCount} questões ao enviar{anyReject ? " (indisponível: há camada reprovada)" : ""}</span>
      </label>

      {incomplete.length ? <p className="editorial-hint">Complete: {incomplete.map((layer) => layerCopy[layer].title).join(", ")}.</p> : null}
      <button type="submit" className="primary-button" disabled={busy || incomplete.length > 0}>{busy ? "Registrando…" : "Registrar revisão"}</button>
      {message ? <p role={message.kind === "error" ? "alert" : "status"} className="editorial-message" data-kind={message.kind}>{message.text}</p> : null}
    </form>
  );
}
