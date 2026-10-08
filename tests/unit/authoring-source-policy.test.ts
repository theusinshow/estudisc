// @vitest-environment node
import { expect,it } from "vitest";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
import { sourceAuthoringContext } from "@/db/repositories/authoring-context-repository";
import { buildAuthoringPacket } from "@/features/content-qa/authoring-contracts";
import { resolveLessonVersionContext } from "@/features/import/application/lesson-version-policy";
import { previewAuthoringMetadata } from "@/features/content-qa/metadata-preview";
it("binds text additions to actual source hashes while preserving every original field/Activity/Question and old numeric packets",()=>{
  const {context,packet}=lessonVersionFixture(true),source=sourceAuthoringContext([context],"actual-admin",packet.lesson.id)!;
  expect(source.authorId).toBe("actual-admin");expect(()=>resolveLessonVersionContext([context],packet)).not.toThrow();
  for(const type of ["text","note","warning","example","summary","worked-example","concept","code"] as const){
    const payload=type==="code"?{type,code:"const value = 1;",language:"javascript"}:{type,content:"Texto adicional do autor."};
    const draft=buildAuthoringPacket(source,[{id:`new-${type}`,type,schemaVersion:1,conceptIds:[source.lesson.concepts[0].id],payload}],`studio.${type}`);
    expect(()=>resolveLessonVersionContext([context],draft)).not.toThrow();expect(draft.lesson.activities).toEqual(source.lesson.activities);expect(draft.lesson.blocks.slice(0,-1)).toEqual(source.lesson.blocks);
  }
});
it("rejects media/assessments, incorrect payload families and edited source fields",()=>{
  const {context,packet}=lessonVersionFixture(true),source=sourceAuthoringContext([context],"admin",packet.lesson.id)!;
  const draft=buildAuthoringPacket(source,[{id:"new-note",type:"note",schemaVersion:1,conceptIds:[source.lesson.concepts[0].id],payload:{type:"note",content:"Texto."}}],"studio.note");
  const wrong=structuredClone(draft);wrong.lesson.blocks.at(-1)!.payload.type="figure";expect(()=>resolveLessonVersionContext([context],wrong)).toThrow();
  const altered=structuredClone(draft);altered.lesson.objectives.push("Changed goal");expect(()=>resolveLessonVersionContext([context],altered)).toThrow();
  const media=structuredClone(draft);media.lesson.blocks.at(-1)!.type="figure";expect(()=>resolveLessonVersionContext([context],media)).toThrow();
  const concept=structuredClone(draft);Object.assign(concept.lesson.blocks.at(-1)!,{type:"concept",payload:{type:"concept",content:"Texto.",conceptId:"foreign-concept"}});expect(()=>resolveLessonVersionContext([context],concept)).toThrow("Concept payload");
});
it("keeps protected/unknown-rights assets unavailable for public reuse rather than inventing approval",()=>{
  const data={images:[{id:"image",title:"Origem",sourceType:"HUMAN_CREATED",sourceOrganization:"Autor",license:"Não verificada",attribution:"Autor",licenseStatus:"UNKNOWN",recommendedUse:"Consultar",altTextDraft:"Descrição suficiente da figura"}],videos:[],books:[]};
  const result=previewAuthoringMetadata("assets",data);expect(result).toMatchObject({images:[{reusable:false,licenseStatus:"UNKNOWN",exposure:"unknown"}]});
});
