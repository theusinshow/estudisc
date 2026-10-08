import { expect,it } from "vitest";
import { projectKnowledgeMap } from "@/features/concepts/knowledge-map-projection";
import { knowledgePositions } from "@/features/concepts/knowledge-map-layout";
import type { PublishedConceptLink,DeclaredKnowledgeEdge } from "@/features/concepts/knowledge-map-contracts";
const now=new Date("2026-10-08T12:00:00Z");
const links:PublishedConceptLink[]=["a","b","c"].map(id=>({id,title:id,summary:null,areaId:"MAT",areaTitle:"Matemática",lessonId:`l-${id}`,lessonTitle:id,trackId:"one",trackTitle:"Trilha um"}));
const edge:DeclaredKnowledgeEdge={conceptId:"a",prerequisiteId:"b",trackId:"one",trackTitle:"Trilha um",strength:"required"};
it("does not invent mastery from published lessons or neighboring Concepts and uses actual due schedules",()=>{
  const snapshot=projectKnowledgeMap(links,[edge],[],[{conceptId:"c",nextReviewAt:now},{conceptId:"a",nextReviewAt:new Date(now.getTime()+1)}],now);
  expect(snapshot.nodes.find(n=>n.id==="a")).toMatchObject({state:"unseen",masteryLevel:0,evidenceCount:0});
  expect(snapshot.nodes.find(n=>n.id==="c")).toMatchObject({state:"review_due",masteryLevel:0});expect(snapshot.edges[0].ready).toBe(false);
});
it("keeps track scopes and recommended strength, deduplicates versions and reports unavailable references",()=>{
  const declared=[edge,{...edge,trackId:"two",trackTitle:"Trilha dois",strength:"recommended" as const},{...edge,prerequisiteId:"draft"}];
  const snapshot=projectKnowledgeMap([...links,links[0]],declared,[],[],now);
  expect(snapshot.nodes).toHaveLength(3);expect(snapshot.nodes[0].lessons).toHaveLength(1);expect(snapshot.edges).toHaveLength(2);
  expect(snapshot.edges.map(e=>e.strength)).toEqual(["required","recommended"]);expect(snapshot.caveats.join(" ")).toContain("1 relações");
});
it("bounds display layout for aggregate cycles without modifying canonical edges",()=>{
  const cyclic=[{conceptId:"a",prerequisiteId:"b"},{conceptId:"b",prerequisiteId:"a"}];
  const before=structuredClone(cyclic);expect(knowledgePositions(["a","b"],cyclic).size).toBe(2);expect(cyclic).toEqual(before);
  const positions=knowledgePositions(["a","b"],[edge]);expect(positions.get("a")!.x).toBeGreaterThan(positions.get("b")!.x);
});
