// @vitest-environment node
import {expect,it} from "vitest";
import {sourceAuthoringBinding,sourceAuthoringContext,MemoryAuthoringContextRepository} from "@/db/repositories/authoring-context-repository";
import {getMemoryStore} from "@/db/repositories/memory/store";
import {previewAuthoringMetadata} from "@/features/content-qa/metadata-preview";
import {createLessonBlueprint} from "../../tools/estudisc-content-studio/blueprint-policy";
import {lessonVersionFixture} from "../fixtures/lesson-version-import";
const hashes={corpusHash:"a".repeat(64),dependencyHash:"b".repeat(64),policyHash:"c".repeat(64),assetHash:"d".repeat(64)};
it("matches the real pipeline's source wrapper while retaining the raw import hash and original context wire shape",()=>{
 const {context,base}=lessonVersionFixture(true),moduleRecord=context.track.modules.find(m=>m.lessons.some(l=>l.id===base.id))!;
 const binding=sourceAuthoringBinding([context],"actual-admin",base.id,base.version)!;
 const blueprint=createLessonBlueprint(context,moduleRecord.subjectCode,base,hashes,[],"2026-10-08T00:00:00Z");
 expect(binding.blueprintSourceHash).toBe(blueprint.sourceHash);expect(binding.blueprintSourceHash).not.toBe(binding.context.target.baseHash);
 expect(binding.context).toEqual(sourceAuthoringContext([context],"actual-admin",base.id,base.version));expect(binding.context).not.toHaveProperty("blueprintSourceHash");
 expect(previewAuthoringMetadata("blueprint",blueprint,binding.context,binding)).toMatchObject({sourceMatches:true,reviewState:"UNREVIEWED"});
 expect(previewAuthoringMetadata("blueprint",blueprint,binding.context)).toMatchObject({sourceMatches:false});
 for(const change of ["track","trackVersion","lessonVersion","subject","hash"]){const altered=structuredClone(blueprint);if(change==="track")altered.identity.trackId="foreign";if(change==="trackVersion")altered.identity.trackVersion++;if(change==="lessonVersion")altered.identity.lessonVersion++;if(change==="subject")altered.summary.subjectCode="FOREIGN";if(change==="hash")altered.sourceHash=binding.context.target.baseHash;expect(previewAuthoringMetadata("blueprint",altered,binding.context,binding)).toMatchObject({sourceMatches:false});}
});
it("uses actual memory source identity/subject and fails closed for unavailable versions",async()=>{
 const {context,base}=lessonVersionFixture(true),store=structuredClone(getMemoryStore());store.packImports=[{packId:context.packId,version:context.version,contentHash:"fixture",manifest:context}];
 const reader=new MemoryAuthoringContextRepository(store),binding=(await reader.getBinding("actual-admin",base.id,base.version))!;
 expect(binding.subjectCode).toBe("MAT");expect(binding.context.authorId).toBe("actual-admin");expect(await reader.getBinding("actual-admin",base.id,999)).toBeNull();
});
