"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Component,useCallback,useState,useSyncExternalStore,type ReactNode } from "react";
import { Sheet } from "@/components/ui/dialog";
import type { KnowledgeSnapshot } from "./knowledge-map-contracts";
import { studentConceptLabel } from "@/features/concepts/student-label";

const Flow=dynamic(()=>import(/* webpackChunkName: "knowledge-flow" */"./knowledge-flow"),{ssr:false,loading:()=> <p role="status">Carregando mapa. A lista continua disponível.</p>});
class CanvasFallback extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}render(){return this.state.failed?<p role="alert">O mapa não pôde abrir. Use a lista de conceitos abaixo.</p>:this.props.children;}}
const labels={unseen:"Ainda não praticado",developing:"Em desenvolvimento",consolidated:"Consolidado",review_due:"Revisão prevista"};
const countLabel=(count:number,one:string,many:string)=>`${count} ${count===1?one:many}`;
const subscribe=()=>()=>{},clientReady=()=>true,serverReady=()=>false;
export function KnowledgeMapView({snapshot}:{snapshot:KnowledgeSnapshot}){
  const ready=useSyncExternalStore(subscribe,clientReady,serverReady);
  const [area,setArea]=useState("all"),[showMap,setShowMap]=useState(false),[selected,setSelected]=useState<string|null>(null);
  const select=useCallback((id:string)=>setSelected(id),[]);
  const areas=[...new Map(snapshot.nodes.flatMap(node=>node.areas.map(area=>[area.id,area] as const))).values()].sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"));
  const nodes=snapshot.nodes.filter(node=>area==="all"||node.areas.some(row=>row.id===area));
  const edges=snapshot.edges.filter(edge=>nodes.some(node=>node.id===edge.conceptId)&&nodes.some(node=>node.id===edge.prerequisiteId));
  const canvasNodes=nodes.slice(0,36),canvasEdges=edges.filter(edge=>canvasNodes.some(node=>node.id===edge.conceptId)&&canvasNodes.some(node=>node.id===edge.prerequisiteId));
  // A Concept in several areas is listed under its first one, so each appears once.
  const groups=[...nodes.reduce((map,node)=>{const first=node.areas[0]??{id:"outros",title:"Outros"};const group=map.get(first.id)??{id:first.id,title:first.title,nodes:[] as typeof nodes,started:0};group.nodes.push(node);if(node.state!=="unseen")group.started++;return map.set(first.id,group);},new Map<string,{id:string;title:string;nodes:typeof nodes;started:number}>()).values()].sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"));
  const concept=snapshot.nodes.find(node=>node.id===selected);
  const related=concept?snapshot.edges.filter(edge=>edge.conceptId===concept.id):[];
  return <>
    <div className="learning-controls targeted-practice-controls"><label className="learning-field" htmlFor="knowledge-area">Área do conhecimento<select id="knowledge-area" value={area} disabled={!ready} onChange={event=>{setArea(event.target.value);setSelected(null);}}><option value="all">Todas as áreas</option>{areas.map(row=><option key={row.id} value={row.id}>{row.title}</option>)}</select></label><button type="button" className="secondary-action" disabled={!ready||nodes.length===0} aria-expanded={showMap} onClick={()=>setShowMap(!showMap)}>{showMap?"Fechar mapa interativo":"Abrir mapa interativo"}</button></div>
    <p>O domínio vem das respostas registradas. As relações mostram pré-requisitos declarados em cada trilha.</p>
    {showMap&&<><p>Mapa de {canvasNodes.length} conceitos desta seleção. A lista abaixo reúne todos os {nodes.length} conceitos.</p><CanvasFallback key={area}><Flow concepts={canvasNodes} edges={canvasEdges} onSelect={select}/></CanvasFallback></>}
    {snapshot.caveats.map(note=><p className="learning-hint" key={note}>{note}</p>)}
    {/* Grouped by area (all closed: the student opens a subject), one compact row per Concept. */}
    <ol className="knowledge-groups" aria-label="Conceitos por área">{groups.map(group=><li key={group.id}><details className="knowledge-group">
      <summary><span><strong>{group.title}</strong><small>{countLabel(group.nodes.length,"conceito","conceitos")}{group.started>0?` · ${countLabel(group.started,"praticado","praticados")}`:""}</small></span></summary>
      <ul aria-label={`Conceitos de ${group.title}`}>{group.nodes.map(node=><li key={node.id} className="knowledge-list-node">
        <span className={`knowledge-dot knowledge-state-${node.state}`} aria-hidden="true" />
        <span className="knowledge-row-text"><button type="button" className="knowledge-concept-button" disabled={!ready} onClick={()=>select(node.id)}>{node.title}</button><small>{node.state==="unseen"?labels.unseen:`${labels[node.state]} · ${node.masteryLabel}`} · {countLabel(node.lessons.length,"aula","aulas")}</small></span>
        <Link href={`/concepts/${encodeURIComponent(node.id)}`} aria-label={`Ver conceito e aulas: ${studentConceptLabel(node.title)}`}>Ver</Link>
      </li>)}</ul>
    </details></li>)}</ol>
    {nodes.length===0&&<p>Nenhum conceito publicado nesta área.</p>}
    <Sheet open={Boolean(concept)} title={concept?studentConceptLabel(concept.title):"Detalhes do conceito"} onClose={()=>setSelected(null)}>{concept&&<><p>{concept.summary??"Este conceito ainda não tem resumo."}</p><p><strong>{concept.masteryLabel}</strong> · {countLabel(concept.evidenceCount,"resposta","respostas")}</p>{concept.reasons.map(reason=><p key={reason}>{reason}</p>)}{concept.reviewAt&&<Link className="primary-action" href="/review">Abrir revisões previstas</Link>}<h3>Relações curriculares</h3>{related.length===0?<p>Nenhuma relação importada para este conceito.</p>:<ul>{related.map(edge=><li key={edge.id}><Link href={`/concepts/${encodeURIComponent(edge.prerequisiteId)}`}>{snapshot.nodes.find(node=>node.id===edge.prerequisiteId)?.title??edge.prerequisiteId}</Link> · {edge.strength==="required"?"Obrigatório":"Recomendado"} · {edge.trackTitle}{edge.strength==="required"&&<p>{edge.ready?"Nível Entendido ou superior já registrado neste pré-requisito.":"O planejamento de uma aula completa considera este pré-requisito antes de avançar."}</p>}</li>)}</ul>}<h3>Aulas publicadas</h3><ul>{concept.lessons.map(lesson=><li key={JSON.stringify([lesson.id,lesson.trackTitle])}><Link href={`/lessons/${encodeURIComponent(lesson.id)}`}>{lesson.title}</Link> · {lesson.trackTitle}</li>)}</ul></>}</Sheet>
  </>;
}
