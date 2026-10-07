"use client";
import { useState } from "react";
import type { FigureBlockPayload } from "./block-schemas";
import { Paragraphs } from "@/components/ui/paragraphs";

export function FigureImage({ figure, className, onFailure }: { figure: Pick<FigureBlockPayload, "src" | "alt" | "width" | "height">; className?: string; onFailure?: (failed: boolean) => void }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className="learning-hint"><p>Não foi possível carregar a imagem.</p><Paragraphs text={figure.alt}/><button type="button" onClick={() => { setFailed(false); onFailure?.(false); }}>Tentar carregar imagem</button></div> :
    // eslint-disable-next-line @next/next/no-img-element -- approved Pack-embedded data URI, rendered only as an image
    <img className={className} src={figure.src} alt={figure.alt} width={figure.width} height={figure.height} loading="lazy" decoding="async" onError={() => { setFailed(true); onFailure?.(true); }}/>;
}
export function SafeFigure({ figure }: { figure: FigureBlockPayload }) {
  return <figure className="lesson-figure"><FigureImage figure={figure}/><figcaption><span>{figure.caption}</span>{figure.credit && <small>{figure.credit}</small>}</figcaption>{figure.longDescription && <details className="lesson-figure-description"><summary>Descrição da imagem</summary><Paragraphs text={figure.longDescription}/></details>}</figure>;
}
