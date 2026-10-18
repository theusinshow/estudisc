"use client";

import type { Confidence } from "./confidence";

const LEVELS: ReadonlyArray<readonly [Confidence, string]> = [["sure", "Tenho certeza"], ["unsure", "Acho que sim"], ["guess", "Chutei"]];

/** ADR 0071: optional self-report before checking. Tap again to clear; nothing is required to submit. */
export function ConfidencePicker({ value, onChange, disabled }: Readonly<{ value: Confidence | null; onChange: (next: Confidence | null) => void; disabled?: boolean }>) {
  return (
    <fieldset className="confidence-picker" disabled={disabled}>
      <legend>Quanto você tem certeza? <span>(opcional)</span></legend>
      <div className="confidence-levels">
        {LEVELS.map(([key, label]) => (
          <button key={key} type="button" className="confidence-level" data-level={key} aria-pressed={value === key} onClick={() => onChange(value === key ? null : key)}>{label}</button>
        ))}
      </div>
    </fieldset>
  );
}

/** One calibration line after the result; null when there is nothing worth saying. */
export function confidenceNote(correct: boolean, confidence: Confidence | null) {
  if (!confidence) return null;
  if (correct && confidence === "guess") return "Acertou no chute: este conceito volta logo para você confirmar.";
  if (!correct && confidence === "sure") return "Ponto cego encontrado: você tinha certeza, então ele vai para o topo da revisão. Ótimo achado.";
  if (correct && confidence === "sure") return "Certo e com certeza: conceito firme.";
  if (!correct && confidence === "guess") return "Você já desconfiava. Vamos rever com calma.";
  return null;
}
