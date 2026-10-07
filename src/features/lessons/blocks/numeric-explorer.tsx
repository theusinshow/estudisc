"use client";

import { useId } from "react";
import { useInteractionState } from "../use-interaction-state";
import type { InteractionTarget } from "../interaction-state";
import { numericExplorerSchema, type NumericExplorerConfig } from "./numeric-explorer-schema";
import { LinearExplorer } from "./linear-explorer";

type ExplorerProps = NumericExplorerConfig & { interaction?: InteractionTarget; enhanced?: boolean };
export function NumericExplorer(props: ExplorerProps) {
  return props.mode === "linear" ? <LinearExplorer {...props}/> : <PercentageExplorer {...props}/>;
}
function PercentageExplorer({ initialValue, initialPercentage, interaction, enhanced = false }: Extract<ExplorerProps, { mode?: undefined }>) {
  const id = useId();
  const { value, update } = useInteractionState(interaction ? { ...interaction, kind: "numeric-explorer" } : undefined, { base: String(initialValue), percentage: String(initialPercentage) }, () => true);
  const { base, percentage } = value;
  const setBase = (base: string) => update({ ...value, base });
  const setPercentage = (percentage: string) => update({ ...value, percentage });
  const numericBase = Number(base.replace(",", "."));
  const numericPercentage = Number(percentage.replace(",", "."));
  const valid = base.trim() !== "" && percentage.trim() !== "" && numericExplorerSchema.safeParse({ initialValue: numericBase, initialPercentage: numericPercentage }).success;
  return <section className="learning-interaction" aria-label={"Explore a porcentagem"}><h3 id={`${id}-title`}>Explore a porcentagem</h3><div className="learning-controls"><label className="learning-field">Valor base<input maxLength={64} inputMode="decimal" value={base} onChange={event => setBase(event.target.value)} /></label><label className="learning-field">Porcentagem<input maxLength={64} inputMode="decimal" value={percentage} onChange={event => setPercentage(event.target.value)} /></label></div>{enhanced && <label className="learning-field">Porcentagem · controle deslizante<input type="range" min={0} max={500} step={0.1} value={Math.round(Math.min(500, Math.max(0, Number.isFinite(numericPercentage) ? numericPercentage : 0)) * 10) / 10} onChange={event => setPercentage(event.target.value)}/></label>}<output aria-live="polite">{valid ? `${numericPercentage.toLocaleString("pt-BR")}% de ${numericBase.toLocaleString("pt-BR")} = ${(numericBase * numericPercentage / 100).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}` : "Informe uma base entre 0 e 1.000.000 e uma porcentagem entre 0 e 500."}</output><p>A porcentagem representa uma parte a cada 100. Alterar os valores ajuda a comparar a parte com o total.</p></section>;
}
