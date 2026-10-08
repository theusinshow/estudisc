import { asc, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase,PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { concepts,lessonConcepts,lessons,modules,tracks,conceptPrerequisites,reviewSchedules } from "@/db/schema";
import { ConceptEvidenceRepository } from "./concept-evidence-repository";
import { projectKnowledgeMap } from "@/features/concepts/knowledge-map-projection";
import type { DeclaredKnowledgeEdge,PublishedConceptLink } from "@/features/concepts/knowledge-map-contracts";
import { getMemoryStore } from "./memory/store";

export class KnowledgeMapRepository{
  constructor(private readonly db:PgDatabase<PgQueryResultHKT,typeof schema>=getDatabase()){}
  async get(ownerId:string,now=new Date()){
    const rows=await this.db.select({internalId:concepts.id,id:concepts.stableId,title:concepts.title,summary:concepts.summary,areaId:modules.subjectCode,areaTitle:modules.title,moduleId:modules.stableId,lessonId:lessons.stableId,lessonTitle:lessons.title,trackId:tracks.id,trackTitle:tracks.title})
      .from(concepts).innerJoin(lessonConcepts,eq(lessonConcepts.conceptId,concepts.id)).innerJoin(lessons,eq(lessons.id,lessonConcepts.lessonId)).innerJoin(modules,eq(modules.id,lessons.moduleId)).innerJoin(tracks,eq(tracks.id,modules.trackId))
      .where(sql`(${lessons.metadata}->>'kind' IS NULL OR (${lessons.metadata}->>'status'='published' AND ${lessons.metadata}->>'qaReleaseId' IS NOT NULL))`).orderBy(asc(concepts.title));
    const links:PublishedConceptLink[]=rows.map(row=>({...row,areaId:row.areaId??`module:${row.moduleId}`,areaTitle:row.areaId?({MAT:"Matemática",POR:"Português",CIE:"Ciências",GH:"História e Geografia"} as Record<string,string>)[row.areaId]??row.areaTitle:row.areaTitle}));
    if(!links.length)return projectKnowledgeMap([],[],[],[],now);
    const [allConcepts,rawEdges,reviews,evidence]=await Promise.all([
      this.db.select({id:concepts.id,stableId:concepts.stableId}).from(concepts),
      this.db.select({trackId:tracks.id,trackTitle:tracks.title,conceptId:conceptPrerequisites.conceptId,prerequisiteId:conceptPrerequisites.prerequisiteConceptId,strength:conceptPrerequisites.strength}).from(conceptPrerequisites).innerJoin(tracks,eq(tracks.id,conceptPrerequisites.trackId)).where(inArray(conceptPrerequisites.trackId,[...new Set(rows.map(row=>row.trackId))])),
      this.db.select({conceptId:concepts.stableId,nextReviewAt:reviewSchedules.nextReviewAt}).from(reviewSchedules).innerJoin(concepts,eq(concepts.id,reviewSchedules.conceptId)).where(eq(reviewSchedules.ownerId,ownerId)),
      new ConceptEvidenceRepository(this.db).listForConcepts(ownerId,links.map(row=>row.id))
    ]);
    const ids=new Map(allConcepts.map(row=>[row.id,row.stableId]));
    const edges:DeclaredKnowledgeEdge[]=rawEdges.flatMap(edge=>edge.strength==="required"||edge.strength==="recommended"?[{...edge,conceptId:ids.get(edge.conceptId)??edge.conceptId,prerequisiteId:ids.get(edge.prerequisiteId)??edge.prerequisiteId,strength:edge.strength}]:[]);
    return projectKnowledgeMap(links,edges,evidence,reviews,now);
  }
}
export class MemoryKnowledgeMapRepository{
  constructor(private readonly store=getMemoryStore()){}
  async get(ownerId:string,now=new Date()){
    const links:PublishedConceptLink[]=[],edges:DeclaredKnowledgeEdge[]=[];
    for(const entry of this.store.packImports){const pack=entry.manifest;if(pack?.schema!=="caderno.track.v2")continue;
      for(const moduleRecord of pack.track.modules)for(const lesson of moduleRecord.lessons)if(lesson.status==="published")for(const concept of lesson.concepts)links.push({id:concept.id,title:concept.title,summary:concept.summary??null,areaId:moduleRecord.subjectCode,areaTitle:({MAT:"Matemática",POR:"Português",CIE:"Ciências",GH:"História e Geografia"} as Record<string,string>)[moduleRecord.subjectCode]??moduleRecord.title,lessonId:lesson.id,lessonTitle:lesson.title,trackId:pack.track.id,trackTitle:pack.track.title});
      if(pack.track.modules.some(moduleRecord=>moduleRecord.lessons.some(lesson=>lesson.status==="published")))edges.push(...pack.conceptPrerequisites.map(edge=>({trackId:pack.track.id,trackTitle:pack.track.title,conceptId:edge.conceptId,prerequisiteId:edge.prerequisiteConceptId,strength:edge.strength})));
    }
    const represented=new Set(this.store.packImports.flatMap(entry=>entry.manifest?.schema==="caderno.track.v2"?entry.manifest.track.modules.flatMap(moduleRecord=>moduleRecord.lessons.map(lesson=>lesson.id)):[]));
    for(const concept of this.store.concepts.filter(concept=>!represented.has(concept.lessonStableId))){const lesson=this.store.lessons.find(row=>row.stableId===concept.lessonStableId),moduleRecord=lesson&&this.store.modules.find(row=>row.stableId===lesson.moduleStableId),track=moduleRecord&&this.store.tracks.find(row=>row.stableId===moduleRecord.trackStableId);if(lesson&&moduleRecord&&track)links.push({id:concept.stableId,title:concept.title,summary:concept.summary,areaId:`module:${moduleRecord.stableId}`,areaTitle:moduleRecord.title,lessonId:lesson.stableId,lessonTitle:lesson.title,trackId:track.stableId,trackTitle:track.title});}
    return projectKnowledgeMap(links,edges,this.store.conceptEvidence.filter(row=>row.ownerId===ownerId),this.store.reviewSchedules.filter(row=>row.ownerId===ownerId).map(row=>({conceptId:row.conceptStableId,nextReviewAt:row.nextReviewAt})),now);
  }
}
