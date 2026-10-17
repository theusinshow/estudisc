"use client";

import { Check, Divide, Minus, Plus, RotateCcw, Sun } from "lucide-react";
import { useId, type PointerEvent } from "react";
import type { z } from "zod";
import { Paragraphs } from "@/components/ui/paragraphs";
import type { InteractionTarget } from "../interaction-state";
import { useInteractionState } from "../use-interaction-state";
import type { equationBalanceSchema, numberLineSchema, percentGridSchema, timeZonesSchema } from "./numeric-explorer-schema";

/**
 * ADR 0070 model explorers. Exploration only: nothing here records an Attempt or evidence. Positions come from
 * SVG attributes and data-attributes (no inline styles under the CSP); every control works by touch and keyboard.
 */
type Shared = { interaction?: InteractionTarget; enhanced?: boolean };
const NOTE = "Exploração do modelo. As questões da aula registram a prática.";
const decimal = (value: number, digits = 2) => value.toLocaleString("pt-BR", { maximumFractionDigits: digits });

function useExplorer(props: Shared, initial: { position: number; step?: number }) {
  const ref = props.enhanced !== false && props.interaction ? { ...props.interaction, kind: "explorer" as const } : undefined;
  return useInteractionState(ref, { position: initial.position, step: initial.step ?? 0, checked: false }, () => true);
}

export function PercentGrid(props: z.infer<typeof percentGridSchema> & Shared) {
  const id = useId();
  const { value, update } = useExplorer(props, { position: props.initial });
  const painted = Math.max(0, Math.min(100, value.position));
  const set = (position: number) => update({ ...value, position: Math.max(0, Math.min(100, position)), checked: false });
  const paintAt = (event: PointerEvent<HTMLDivElement>) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (cell) { const index = Number(cell.dataset.cell); set(index + 1 === painted ? index : index + 1); }
  };
  const hit = props.target !== undefined && painted === props.target;
  return (
    <section className="learning-interaction model-explorer" aria-label={props.title}>
      <h3>{props.title}</h3>
      {props.target !== undefined ? <p className="model-challenge">Desafio: pinte <strong>{props.target}%</strong> da grade.</p> : null}
      <div className="percent-grid" role="img" aria-label={`${painted} de 100 quadradinhos pintados`} onPointerDown={paintAt}>
        {Array.from({ length: 100 }, (_, index) => <span key={index} data-cell={index} data-on={index < painted || undefined} />)}
      </div>
      <label className="learning-field model-range" htmlFor={id}>Quadradinhos pintados
        <input id={id} type="range" min={0} max={100} value={painted} aria-valuetext={`${painted}%`} onChange={event => set(Number(event.target.value))} />
      </label>
      <output className="model-readout" aria-live="polite"><strong>{painted}%</strong> = {painted}/100 = {decimal(painted / 100)}</output>
      {props.target !== undefined ? (
        <div className="model-actions">
          <button type="button" className="secondary-button" onClick={() => update({ ...value, checked: true })}><Check aria-hidden="true" />Conferir</button>
          {value.checked ? <p role="status" className="model-feedback" data-hit={hit}>{hit ? `Isso: ${props.target} de cada 100.` : painted < props.target ? `Faltam ${props.target - painted} quadradinhos.` : `Passou ${painted - props.target} quadradinhos.`}</p> : null}
        </div>
      ) : null}
      <Paragraphs text={props.explanation} /><small>{NOTE}</small>
    </section>
  );
}

export function NumberLine(props: z.infer<typeof numberLineSchema> & Shared) {
  const id = useId();
  const { value, update } = useExplorer(props, { position: props.initial });
  const at = Math.max(0, Math.min(props.divisions, value.position));
  const valueAt = (division: number) => props.min + ((props.max - props.min) * division) / props.divisions;
  const x = (division: number) => 16 + (288 * division) / props.divisions;
  const set = (position: number) => update({ ...value, position: Math.max(0, Math.min(props.divisions, position)), checked: false });
  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    set(Math.round((((event.clientX - box.left) / box.width) * 320 - 16) / 288 * props.divisions));
  };
  const labels = new Map(props.ticks.map(tick => [tick.at, tick.label]));
  const hit = props.target !== undefined && at === props.target;
  const near = props.target !== undefined && Math.abs(at - props.target) <= Math.max(1, Math.round(props.divisions / 10));
  return (
    <section className="learning-interaction model-explorer" aria-label={props.title}>
      <h3>{props.title}</h3>
      {props.targetLabel ? <p className="model-challenge">Onde fica <strong>{props.targetLabel}</strong>?</p> : null}
      <svg className="number-line" viewBox="0 0 320 88" aria-hidden="true" onPointerDown={pick}>
        <line className="number-line-axis" x1="16" x2="304" y1="44" y2="44" />
        {Array.from({ length: props.divisions + 1 }, (_, division) => (
          <g key={division}>
            <line className="number-line-tick" data-major={labels.has(division) || undefined} x1={x(division)} x2={x(division)} y1={labels.has(division) ? 34 : 38} y2={labels.has(division) ? 54 : 50} />
            {labels.has(division) ? <text className="number-line-label" x={x(division)} y="80" textAnchor="middle">{labels.get(division)}</text> : null}
          </g>
        ))}
        {value.checked && props.target !== undefined ? <circle className="number-line-target" cx={x(props.target)} cy="44" r="13" /> : null}
        <g className="number-line-marker" data-state={value.checked ? (hit ? "hit" : "miss") : "idle"}>
          <line x1={x(at)} x2={x(at)} y1="12" y2="44" />
          <circle cx={x(at)} cy="12" r="9" />
        </g>
      </svg>
      <label className="learning-field model-range" htmlFor={id}>Posição na reta
        <input id={id} type="range" min={0} max={props.divisions} step={1} value={at} aria-valuetext={decimal(valueAt(at), 3)} onChange={event => set(Number(event.target.value))} />
      </label>
      <output className="model-readout" aria-live="polite">Marcador em <strong>{decimal(valueAt(at), 3)}</strong></output>
      {props.target !== undefined ? (
        <div className="model-actions">
          <button type="button" className="secondary-button" onClick={() => update({ ...value, checked: true })}><Check aria-hidden="true" />Conferir</button>
          {value.checked ? <p role="status" className="model-feedback" data-hit={hit}>{hit ? `Exato: ${props.targetLabel} = ${decimal(valueAt(props.target), 3)}.` : near ? "Muito perto. Confira as divisões." : "Ainda não. Divida a reta em partes iguais e conte."}</p> : null}
        </div>
      ) : null}
      <Paragraphs text={props.explanation} /><small>{NOTE}</small>
    </section>
  );
}

export function EquationBalance(props: z.infer<typeof equationBalanceSchema> & Shared) {
  const { coefficient: a, constant: b, result: c } = props;
  const solution = (c - b) / a;
  const { value, update } = useExplorer(props, { position: 1 });
  const x = Math.max(1, Math.min(9, value.position)), taken = Math.max(0, Math.min(b, value.step));
  const left = a * x + b - taken, right = c - taken, diff = right - left;
  const tilt = diff === 0 ? 0 : Math.sign(diff) * Math.min(2, Math.ceil(Math.abs(diff) / 3));
  const divided = value.checked && taken === b && a > 1;
  const term = `${a === 1 ? "" : a}x`;
  const equation = divided ? `x = ${solution}` : `${term}${b - taken > 0 ? ` + ${b - taken}` : ""} = ${c - taken}`;
  const status = diff === 0 ? `Equilibrou: com x = ${x}, os dois lados pesam ${left}.` : diff < 0 ? "O lado do x está mais pesado: diminua x." : "O lado do x está mais leve: aumente x.";
  return (
    <section className="learning-interaction model-explorer" aria-label={props.title}>
      <h3>{props.title}</h3>
      <p className="balance-equation" aria-live="polite">{equation}</p>
      <div className="balance" aria-hidden="true">
        <div className="balance-beam" data-tilt={tilt}>
          <div className="balance-pan">
            {Array.from({ length: a }, (_, index) => <span key={`x${index}`} className="balance-box">x</span>)}
            {Array.from({ length: b - taken }, (_, index) => <span key={index} className="balance-unit" />)}
          </div>
          <div className="balance-pan">{Array.from({ length: right }, (_, index) => <span key={index} className="balance-unit" />)}</div>
        </div>
        <span className="balance-stand" />
      </div>
      <p className="model-readout">Esquerda: {a === 1 ? "x" : `${a} caixas x`}{b - taken > 0 ? ` e ${b - taken} ${b - taken === 1 ? "peso" : "pesos"}` : ""} · Direita: {right} {right === 1 ? "peso" : "pesos"}</p>
      <div className="model-actions">
        <span className="model-stepper" role="group" aria-label="Valor de x">
          <button type="button" aria-label="Diminuir x" disabled={x <= 1} onClick={() => update({ ...value, position: x - 1 })}><Minus aria-hidden="true" /></button>
          <span>x = {x}</span>
          <button type="button" aria-label="Aumentar x" disabled={x >= 9} onClick={() => update({ ...value, position: x + 1 })}><Plus aria-hidden="true" /></button>
        </span>
        <button type="button" className="secondary-button" disabled={taken >= b} onClick={() => update({ ...value, step: taken + 1, checked: false })}>Tirar 1 peso de cada lado</button>
        {a > 1 && taken === b && !divided ? <button type="button" className="secondary-button" onClick={() => update({ ...value, checked: true })}><Divide aria-hidden="true" />Dividir os dois lados por {a}</button> : null}
        <button type="button" className="text-button" onClick={() => update({ position: 1, step: 0, checked: false })}><RotateCcw aria-hidden="true" />Recomeçar</button>
      </div>
      <p role="status" className="model-feedback" data-hit={diff === 0}>{status}</p>
      <Paragraphs text={props.explanation} /><small>{NOTE}</small>
    </section>
  );
}

const clock = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export function TimeZones(props: z.infer<typeof timeZonesSchema> & Shared) {
  const id = useId();
  const { value, update } = useExplorer(props, { position: props.initialUtc });
  const utc = Math.max(0, Math.min(23, value.position));
  return (
    <section className="learning-interaction model-explorer" aria-label={props.title}>
      <h3>{props.title}</h3>
      <svg className="sun-track" viewBox="0 0 320 40" aria-hidden="true">
        <line x1="16" x2="304" y1="20" y2="20" />
        <g className="sun-mark" transform={`translate(${16 + (288 * utc) / 23} 20)`}><circle r="13" /><Sun x={-9} y={-9} width={18} height={18} /></g>
      </svg>
      <label className="learning-field model-range" htmlFor={id}>Hora em Greenwich (UTC)
        <input id={id} type="range" min={0} max={23} value={utc} aria-valuetext={`${clock(utc)} em Greenwich`} onChange={event => update({ ...value, position: Number(event.target.value) })} />
      </label>
      <output className="model-readout" aria-live="polite">Greenwich (UTC): <strong>{clock(utc)}</strong></output>
      <ul className="zone-list">
        {props.places.map(place => {
          const total = utc + place.offset, local = ((total % 24) + 24) % 24, day = local >= 6 && local < 18;
          const shift = total >= 24 ? " · dia seguinte" : total < 0 ? " · dia anterior" : "";
          return (
            <li key={place.label} className="zone" data-day={day}>
              <strong>{place.label}</strong>
              <span className="zone-clock">{clock(local)}</span>
              <small>{day ? "dia" : "noite"} · UTC{place.offset >= 0 ? "+" : "−"}{Math.abs(place.offset)}{shift}</small>
            </li>
          );
        })}
      </ul>
      <Paragraphs text={props.explanation} /><small>{NOTE}</small>
    </section>
  );
}
