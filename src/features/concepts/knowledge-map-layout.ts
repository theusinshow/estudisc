import { findGraphCycles } from "@/features/curriculum/validation";

/** Stable display coordinates only; no learning decision is derived from layout. */
export function knowledgePositions(ids:readonly string[],edges:readonly {conceptId:string;prerequisiteId:string}[]){
  const rank=new Map(ids.map(id=>[id,0]));
  if(!findGraphCycles(edges.map(edge=>[edge.conceptId,edge.prerequisiteId] as const)).length){
    for(let pass=0;pass<ids.length;pass++){let changed=false;for(const edge of edges){if(!rank.has(edge.conceptId)||!rank.has(edge.prerequisiteId))continue;const next=rank.get(edge.prerequisiteId)!+1;if(next>rank.get(edge.conceptId)!){rank.set(edge.conceptId,next);changed=true;}}if(!changed)break;}
  }
  const counts=new Map<number,number>();
  return new Map([...ids].sort().map(id=>{const column=rank.get(id)??0,row=counts.get(column)??0;counts.set(column,row+1);return[id,{x:column*280,y:row*130}] as const;}));
}
