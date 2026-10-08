import { and, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import { concepts, conceptPrerequisites } from "@/db/schema";
import type * as schema from "@/db/schema";
import { getMemoryStore } from "./memory/store";

export class ConceptRelationRepository {
  constructor(private readonly db: PgDatabase<PgQueryResultHKT, typeof schema> = getDatabase()) {}
  async list(conceptId:string){
    const [node]=await this.db.select({id:concepts.id}).from(concepts).where(eq(concepts.stableId,conceptId)).limit(1);
    if(!node)return [];
    return this.db.select({prerequisiteConceptId:concepts.stableId,strength:conceptPrerequisites.strength}).from(conceptPrerequisites).innerJoin(concepts,eq(concepts.id,conceptPrerequisites.prerequisiteConceptId)).where(eq(conceptPrerequisites.conceptId,node.id)).limit(20);
  }
  async get(conceptId: string, prerequisiteConceptId: string) {
    const nodes=await this.db.select({id:concepts.id,stableId:concepts.stableId}).from(concepts).where(inArray(concepts.stableId,[conceptId,prerequisiteConceptId]));
    const concept=nodes.find(node=>node.stableId===conceptId),prerequisite=nodes.find(node=>node.stableId===prerequisiteConceptId);
    if(!concept||!prerequisite)return null;
    const [edge]=await this.db.select({strength:conceptPrerequisites.strength}).from(conceptPrerequisites).where(and(eq(conceptPrerequisites.conceptId,concept.id),eq(conceptPrerequisites.prerequisiteConceptId,prerequisite.id))).limit(1);
    return edge?{conceptId,prerequisiteConceptId,strength:edge.strength}:null;
  }
}
export class MemoryConceptRelationRepository {
  constructor(private readonly store=getMemoryStore()){}
  async list(conceptId:string){
    const edges=[...this.store.packImports].reverse().flatMap(entry=>entry.manifest?.schema==="caderno.track.v2"?entry.manifest.conceptPrerequisites:[]).filter(edge=>edge.conceptId===conceptId);
    return edges.filter((edge,index)=>edges.findIndex(other=>other.prerequisiteConceptId===edge.prerequisiteConceptId)===index).slice(0,20);
  }
  async get(conceptId:string,prerequisiteConceptId:string){
    return [...this.store.packImports].reverse().flatMap(entry=>entry.manifest?.schema==="caderno.track.v2"?entry.manifest.conceptPrerequisites:[]).find(edge=>edge.conceptId===conceptId&&edge.prerequisiteConceptId===prerequisiteConceptId)??null;
  }
}
