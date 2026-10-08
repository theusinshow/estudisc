"use client";
import { useEffect,useMemo,useRef } from "react";
import { ReactFlow,Handle,Position,Controls,MarkerType,type NodeProps,type Node,type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { KnowledgeNode,KnowledgeEdge } from "./knowledge-map-contracts";
import { knowledgePositions } from "./knowledge-map-layout";

type ConceptFlowNode=Node<{concept:KnowledgeNode;select:(id:string)=>void},"concept">;
function ConceptNode({data}:NodeProps<ConceptFlowNode>){return <div className={`knowledge-flow-node knowledge-state-${data.concept.state}`}><Handle type="target" position={Position.Left} isConnectable={false}/><button type="button" className="nodrag" onClick={()=>data.select(data.concept.id)} aria-label={`Abrir ${data.concept.title}`}><strong>{data.concept.title}</strong><span>{data.concept.masteryLabel}</span>{data.concept.reviewAt&&<span>Revisão prevista</span>}</button><Handle type="source" position={Position.Right} isConnectable={false}/></div>;}
const nodeTypes={concept:ConceptNode};
export default function KnowledgeFlow({concepts,edges,onSelect}:{concepts:KnowledgeNode[];edges:KnowledgeEdge[];onSelect:(id:string)=>void}){
  const frame=useRef<HTMLDivElement>(null),instance=useRef<ReactFlowInstance<ConceptFlowNode>|null>(null);
  useEffect(()=>{if(!frame.current)return;let scheduled=0;const observer=new ResizeObserver(()=>{cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(()=>void instance.current?.fitView({padding:0.15,maxZoom:1,duration:0}));});observer.observe(frame.current);return()=>{observer.disconnect();cancelAnimationFrame(scheduled);};},[]);
  const nodes=useMemo(()=>{const positions=knowledgePositions(concepts.map(node=>node.id),edges);return concepts.map(concept=>({id:concept.id,type:"concept" as const,position:positions.get(concept.id)!,data:{concept,select:onSelect}}));},[concepts,edges,onSelect]);
  const links=useMemo(()=>edges.map(edge=>({id:edge.id,source:edge.prerequisiteId,target:edge.conceptId,type:"smoothstep",label:edge.strength==="required"?"Obrigatório":"Recomendado",className:`knowledge-edge-${edge.strength}`,markerEnd:{type:MarkerType.ArrowClosed}})),[edges]);
  return <div ref={frame} className="knowledge-flow-frame" role="region" aria-label="Mapa interativo de conceitos"><ReactFlow<ConceptFlowNode> nodes={nodes} edges={links} nodeTypes={nodeTypes} onInit={flow=>{instance.current=flow;}} onNodeClick={(_,node)=>onSelect(node.id)} nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} edgesReconnectable={false} elementsSelectable={false} deleteKeyCode={null} fitView fitViewOptions={{padding:0.15,maxZoom:1}} minZoom={0.3} maxZoom={1.7} preventScrolling={false} zoomOnScroll={false} ariaLabelConfig={{"controls.zoomIn.ariaLabel":"Aproximar mapa","controls.zoomOut.ariaLabel":"Afastar mapa","controls.fitView.ariaLabel":"Ajustar mapa","controls.interactive.ariaLabel":"Alternar interação"}}><Controls showInteractive={false}/></ReactFlow></div>;
}
