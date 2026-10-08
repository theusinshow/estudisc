import type { ConceptEvidenceRecord } from "@/db/repositories/concept-evidence-repository";
import { calculateVersionedMastery } from "@/features/mastery/mastery-policy-v2";
import { findGraphCycles } from "@/features/curriculum/api";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { knowledgeSnapshotSchema, type DeclaredKnowledgeEdge, type KnowledgeSnapshot, type PublishedConceptLink } from "./knowledge-map-contracts";

export function projectKnowledgeMap(links:readonly PublishedConceptLink[],declared:readonly DeclaredKnowledgeEdge[],evidence:readonly ConceptEvidenceRecord[],reviews:readonly {conceptId:string;nextReviewAt:Date}[],now:Date):KnowledgeSnapshot{
  const ids=[...new Set(links.map(row=>row.id))].sort();
  const mastery=new Map(ids.map(id=>[id,calculateVersionedMastery(evidence.filter(row=>row.conceptStableId===id),now)]));
  const nodes=ids.map(id=>{
    const rows=links.filter(row=>row.id===id),score=mastery.get(id)!;
    const due=reviews.filter(row=>row.conceptId===id&&row.nextReviewAt<=now).sort((a,b)=>a.nextReviewAt.getTime()-b.nextReviewAt.getTime())[0];
    return {id,title:rows[0].title,summary:rows[0].summary,areas:[...new Map(rows.map(row=>[row.areaId,{id:row.areaId,title:row.areaTitle}])).values()],lessons:[...new Map(rows.map(row=>[JSON.stringify([row.trackId,row.lessonId]),{id:row.lessonId,title:row.lessonTitle,trackTitle:row.trackTitle}])).values()],state:due?"review_due" as const:score.level>=4?"consolidated" as const:score.level>0?"developing" as const:"unseen" as const,masteryState:score.state,masteryLabel:score.label,masteryLevel:score.level,evidenceCount:score.evidenceCount,reviewAt:due?.nextReviewAt.toISOString()??null,reasons:score.reasons};
  });
  const unique=[...new Map(declared.map(edge=>[JSON.stringify([edge.trackId,edge.conceptId,edge.prerequisiteId]),edge])).values()];
  const visible=unique.filter(edge=>ids.includes(edge.conceptId)&&ids.includes(edge.prerequisiteId));
  const missing=unique.length-visible.length;
  const cyclic=[...new Set(visible.map(edge=>edge.trackId))].filter(track=>findGraphCycles(visible.filter(edge=>edge.trackId===track).map(edge=>[edge.conceptId,edge.prerequisiteId] as const)).length>0);
  return knowledgeSnapshotSchema.parse({version:"knowledge-map.v1",asOf:now.toISOString(),nodes,edges:visible.map(edge=>({...edge,id:hashCanonicalJson(edge).slice(0,24),ready:(mastery.get(edge.prerequisiteId)?.level??0)>=2})),caveats:["As relações vêm do currículo importado; o mapa não certifica mapeamento oficial.",...(missing?[`${missing} relações têm conceitos fora do material publicado deste mapa.`]:[]),...(cyclic.length?["Há relações cíclicas em uma fonte; consulte a lista e os detalhes."]:[])]});
}
