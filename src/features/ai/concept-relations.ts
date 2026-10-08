import "server-only";
import { getDatabaseUrl } from "@/db/connection";
import { CatalogRepository } from "@/db/repositories/catalog-repository";
import { MemoryCatalogRepository } from "@/db/repositories/memory-store";
import { ConceptRelationRepository, MemoryConceptRelationRepository } from "@/db/repositories/concept-relation-repository";

export async function listPublishedAiRelations(conceptId:string){
  const memory=getDatabaseUrl()==="memory://local",catalog=memory?new MemoryCatalogRepository():new CatalogRepository();
  const edges=await (memory?new MemoryConceptRelationRepository():new ConceptRelationRepository()).list(conceptId);
  const rows=await Promise.all(edges.map(async edge=>{
    if(!["required","recommended"].includes(edge.strength))return null;
    const concept=await catalog.getConcept(edge.prerequisiteConceptId);if(!concept)return null;
    const available=await Promise.all(concept.lessons.map(lesson=>catalog.getLesson(lesson.stableId,undefined,undefined,true)));
    return available.some(lesson=>lesson?.concepts.some(c=>c.stableId===concept.stableId))?{...edge,title:concept.title}:null;
  }));
  return rows.flatMap(row=>row?[row]:[]);
}
