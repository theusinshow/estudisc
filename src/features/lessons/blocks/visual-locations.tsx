"use client";
import { useId, useState } from "react";
import { Paragraphs } from "@/components/ui/paragraphs";
import { useInteractionState } from "../use-interaction-state";
import type { InteractionTarget } from "../interaction-state";
import { FigureImage } from "./safe-figure";
import type { AuthoredMapConfig, HotspotConfig } from "./visual-interactions-schema";

function Locations({ config, selectedId, zoom = 1, select, changeZoom }: { config: HotspotConfig; selectedId: string | null; zoom?: number; select: (id: string) => void; changeZoom?: (zoom: number) => void }) {
  const id = useId(), selected = config.points.find(point => point.id === selectedId);
  const [failed, setFailed] = useState(false);
  return <section className="learning-interaction visual-locations" aria-label={config.title}>
    <h3 id={`${id}-title`}>{config.title}</h3>
    {changeZoom && <label className="learning-field">Ampliação da imagem<input type="range" min={1} max={3} step={0.25} value={zoom} aria-valuetext={`${zoom} vezes`} onChange={event => changeZoom(Number(event.target.value))}/></label>}
    <div className="location-viewport" tabIndex={0} aria-label="Imagem com pontos de exploração"><div className="location-frame" data-zoom={zoom}><FigureImage figure={config} onFailure={setFailed}/>{!failed && config.points.map((point, index) => <button key={point.id} className="location-marker" type="button" aria-label={`Explorar ${point.label}`} aria-pressed={point.id === selectedId} onClick={() => select(point.id)} data-x={point.x} data-y={point.y}>{index + 1}</button>)}</div></div>
    <p>{config.caption}</p>{config.credit && <small>{config.credit}</small>}
    {config.longDescription && <Paragraphs text={config.longDescription}/>}
    <nav aria-label="Locais da imagem"><ul className="location-list">{config.points.map((point, index) => <li key={point.id}><button type="button" className="secondary-button" aria-pressed={point.id === selectedId} aria-controls={`${id}-detail`} onClick={() => select(point.id)}>{index + 1}. {point.label}</button></li>)}</ul></nav>
    <div id={`${id}-detail`} role="status" aria-live="polite">{selected ? <><h4>{selected.label}</h4><Paragraphs text={selected.description}/></> : <p>Escolha um local na imagem ou na lista para explorar.</p>}</div>
  </section>;
}
export function HotspotImage({ config, interaction }: { config: HotspotConfig; interaction: InteractionTarget }) {
  const { value, update } = useInteractionState({ ...interaction, kind: "hotspot" }, { selectedId: null, zoom: 1 }, state => state.selectedId === null || config.points.some(point => point.id === state.selectedId));
  return <Locations config={config} selectedId={value.selectedId} zoom={value.zoom} select={selectedId => update({ ...value, selectedId })} changeZoom={zoom => update({ ...value, zoom })}/>;
}
export function AuthoredMap({ config, interaction }: { config: AuthoredMapConfig; interaction: InteractionTarget }) {
  const { value, update } = useInteractionState({ ...interaction, kind: "map" }, { selectedId: null }, state => state.selectedId === null || config.points.some(point => point.id === state.selectedId));
  return <Locations config={config} selectedId={value.selectedId} select={selectedId => update({ selectedId })}/>;
}
