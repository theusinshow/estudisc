"use client";
import { useId } from "react";
import type { z } from "zod";
import { linearExplorerSchema } from "./numeric-explorer-schema";
import { useInteractionState } from "../use-interaction-state";
import type { InteractionTarget } from "../interaction-state";
import { Paragraphs } from "@/components/ui/paragraphs";

export function LinearExplorer(config: z.infer<typeof linearExplorerSchema> & { interaction?: InteractionTarget; enhanced?: boolean }) {
  const id = useId();
  const { value, update } = useInteractionState(config.interaction ? { ...config.interaction, kind: "linear-explorer" } : undefined, { input: String(config.initial) }, () => true);
  const raw = config.enhanced === false ? String(config.initial) : value.input;
  const input = Number(raw.replace(",", ".")), valid = raw.trim() !== "" && Number.isFinite(input) && input >= config.min && input <= config.max;
  const ticks = Math.round((Math.min(config.max, Math.max(config.min, valid ? input : config.initial)) - config.min) / config.step);
  const slider = Math.min(config.max, config.min + ticks * config.step);
  return <section className="learning-interaction" aria-label={config.title}>
    <h3 id={`${id}-title`}>{config.title}</h3>
    {config.enhanced !== false && <><label className="learning-field">{config.variableLabel}{config.unit ? ` (${config.unit})` : ""}<input maxLength={64} inputMode="decimal" value={value.input} onChange={event => update({ input: event.target.value })}/></label>
    <label className="learning-field">{config.variableLabel} · controle deslizante<input type="range" min={config.min} max={config.max} step={config.step} value={slider} aria-valuetext={`${slider.toLocaleString("pt-BR")}${config.unit ? ` ${config.unit}` : ""}`} onChange={event => update({ input: event.target.value })}/></label></>}
    <output aria-live="polite">{valid ? `${config.outputLabel}: ${(config.slope * input + config.intercept).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}${config.outputUnit ? ` ${config.outputUnit}` : ""}` : `Informe um valor entre ${config.min.toLocaleString("pt-BR")} e ${config.max.toLocaleString("pt-BR")}.`}</output>
    <Paragraphs text={config.explanation}/><small>Exploração do modelo. As questões da aula registram a prática.</small>
  </section>;
}
