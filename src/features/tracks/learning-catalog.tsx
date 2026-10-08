"use client";
import {useState} from "react";
import Link from "next/link";
import type {TrackDetail} from "@/db/repositories/catalog-repository";
const normalized=(text:string)=>text.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLocaleLowerCase("pt-BR").trim();
export function LearningCatalog({tracks}:{tracks:readonly TrackDetail[]}){
  const [query,setQuery]=useState(""),[area,setArea]=useState("");
  const areas=[...new Set(tracks.flatMap(t=>t.modules.map(m=>m.title)))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const needle=normalized(query);
  const results=tracks.map(track=>({...track,modules:track.modules.filter(m=>!area||m.title===area).map(moduleRecord=>({...moduleRecord,lessons:moduleRecord.lessons.filter(lesson=>normalized(`${track.title} ${track.description??""} ${moduleRecord.title} ${lesson.title}`).includes(needle))})).filter(m=>m.lessons.length)})).filter(t=>t.modules.length);
  const count=results.reduce((total,track)=>total+new Set(track.modules.flatMap(m=>m.lessons.map(l=>l.stableId))).size,0);
  return <div className="learning-catalog">
    <div className="learning-controls"><label className="learning-field">Buscar aulas<input type="search" value={query} maxLength={160} placeholder="Título, assunto ou trilha" onChange={e=>setQuery(e.target.value)}/></label><label className="learning-field">Área<select value={area} onChange={e=>setArea(e.target.value)}><option value="">Todas as áreas</option>{areas.map(title=><option key={title}>{title}</option>)}</select></label><Link href="/knowledge-map">Explorar conceitos</Link></div>
    <p role="status">{count} {count===1?"aula encontrada":"aulas encontradas"}.</p>
    {!results.length?<div className="foundation-panel"><h2>Nenhuma aula encontrada</h2><p>Tente outro termo ou escolha todas as áreas.</p><button type="button" className="button button-secondary" onClick={()=>{setQuery("");setArea("");}}>Limpar filtros</button></div>:results.map(track=><section className="module-section" key={track.stableId}><h2><Link href={`/tracks/${encodeURIComponent(track.stableId)}`}>{track.title}</Link></h2>{track.modules.map(moduleRecord=><div key={moduleRecord.stableId}><h3>{moduleRecord.title}</h3><ul className="record-list" aria-label={`Aulas de ${moduleRecord.title}`}>{moduleRecord.lessons.map(lesson=><li key={lesson.stableId}><Link href={`/lessons/${encodeURIComponent(lesson.stableId)}`}><strong>{lesson.title}</strong><small>{lesson.activityCount} atividades</small></Link></li>)}</ul></div>)}</section>)}
  </div>;
}
