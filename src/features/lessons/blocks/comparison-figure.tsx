"use client";
import { useId } from "react";
import type { FigureBlockPayload } from "./block-schemas";
import type { InteractionTarget } from "../interaction-state";
import { useInteractionState } from "../use-interaction-state";
import { FigureImage, SafeFigure } from "./safe-figure";
import { Paragraphs } from "@/components/ui/paragraphs";

export function ComparisonFigure({ figure, interaction }: { figure: FigureBlockPayload; interaction: InteractionTarget }) {
  const id = useId();
  const { value, update } = useInteractionState({ ...interaction, kind: "comparison" }, { position: 50 }, () => true);
  if (!figure.comparison) return <SafeFigure figure={figure}/>;
  const after = { ...figure, ...figure.comparison, comparison: undefined };
  return <section className="learning-interaction visual-comparison" aria-label={figure.caption}>
    <h3 id={`${id}-title`}>{figure.caption}</h3>
    <div className="comparison-frame"><FigureImage figure={figure}/><div className="comparison-after" data-position={value.position}><FigureImage figure={after}/></div></div>
    <label className="learning-field">Quanto mostrar da segunda imagem<input type="range" min={0} max={100} value={value.position} aria-valuetext={`${value.position}% da segunda imagem`} onChange={event => update({ position: Number(event.target.value) })}/></label>
    <div className="learning-controls"><button type="button" onClick={() => update({ position: 0 })}>Mostrar antes</button><button type="button" onClick={() => update({ position: 100 })}>Mostrar depois</button></div>
    <Paragraphs text={figure.comparison.longDescription}/>
    <details><summary>Ver as duas imagens separadas</summary><SafeFigure figure={{ ...figure, comparison: undefined }}/><SafeFigure figure={after}/></details>
  </section>;
}
