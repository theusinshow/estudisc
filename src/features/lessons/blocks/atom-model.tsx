"use client";
import { useId } from "react";
import { useInteractionState } from "../use-interaction-state";
import type { InteractionTarget } from "../interaction-state";
import type { z } from "zod";
import { atomModelSchema,atomValues } from "./atom-model-schema";
export function AtomModel(props:z.infer<typeof atomModelSchema> & {interaction?:InteractionTarget}){
  const id=useId();const {value,update}=useInteractionState(props.interaction?{...props.interaction,kind:"atom"}:undefined,{protons:String(props.protons),neutrons:String(props.neutrons),electrons:String(props.electrons),prediction:"",revealed:false},state=>!state.revealed||[state.protons,state.neutrons,state.electrons].every(value=>value.trim()!=="")&&atomModelSchema.safeParse({kind:"atom",protons:Number(state.protons),neutrons:Number(state.neutrons),electrons:Number(state.electrons)}).success);
  const particles={protons:value.protons,neutrons:value.neutrons,electrons:value.electrons},prediction=value.prediction,revealed=value.revealed;
  const setParticles=(next:typeof particles)=>update({...value,...next,revealed:false});const setPrediction=(prediction:string)=>update({...value,prediction,revealed:false});const setRevealed=(revealed:boolean)=>update({...value,revealed});
  const values={kind:"atom" as const,protons:Number(particles.protons),neutrons:Number(particles.neutrons),electrons:Number(particles.electrons)};
  const valid=Object.values(particles).every(value=>value.trim()!=="")&&atomModelSchema.safeParse(values).success;
  const derived=atomValues(values.protons,values.neutrons,values.electrons);
  return <section className="learning-interaction" aria-labelledby={`${id}-title`}><h3 id={`${id}-title`}>Monte um átomo</h3><p>Modelo simplificado, sem escala. O núcleo contém prótons e nêutrons; elétrons ocupam a região externa.</p>
    <svg viewBox="0 0 300 160" role="img" aria-label="Núcleo com prótons e nêutrons, envolvido pela região dos elétrons" className="atom-model-svg"><ellipse cx="150" cy="80" rx="125" ry="65" fill="none" stroke="currentColor" strokeDasharray="4 4"/><circle cx="150" cy="80" r="42" fill="none" stroke="currentColor"/><text x="150" y="75" textAnchor="middle">p+ · n</text><text x="150" y="99" textAnchor="middle">Núcleo</text><text x="45" y="85">e−</text><text x="238" y="85">e−</text></svg>
    <div className="learning-controls">{(["protons","neutrons","electrons"] as const).map(key=><label className="learning-field" key={key}>{{protons:"Prótons",neutrons:"Nêutrons",electrons:"Elétrons"}[key]}<input maxLength={64} inputMode="numeric" value={particles[key]} onChange={event=>{setParticles({...particles,[key]:event.target.value});}} /></label>)}</div>
    {valid?<><table><caption>Valores derivados das partículas</caption><tbody><tr><th scope="row">Número atômico Z = prótons</th><td>{derived.atomicNumber}</td></tr><tr><th scope="row">Número de massa A = prótons + nêutrons</th><td>{derived.massNumber}</td></tr><tr><th scope="row">Carga em unidades elementares = prótons − elétrons</th><td>{revealed?derived.charge:"Faça sua previsão abaixo"}</td></tr></tbody></table><form onSubmit={event=>{event.preventDefault();setRevealed(true);}}><label className="learning-field">Qual será a carga?<input maxLength={64} inputMode="numeric" value={prediction} required onChange={event=>setPrediction(event.target.value)} /></label><button type="submit">Conferir previsão</button></form>{revealed&&<p role="status">Carga: {derived.charge}. {prediction.trim()!==""&&Number(prediction)===derived.charge?"Sua previsão está correta.":"Compare a quantidade de prótons positivos e elétrons negativos."}</p>}</>:<p role="alert">Use números inteiros: 1–118 prótons, 0–300 nêutrons e 0–150 elétrons.</p>}
  </section>;
}
