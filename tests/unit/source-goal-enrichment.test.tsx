import {expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {sourceGoalFixture} from "../fixtures/source-goal-enrichment";
import {createEnrichmentPreview} from "../../tools/estudisc-content-studio/enrichment";
import {resolveLessonVersionContext} from "@/features/import/application/lesson-version-policy";
import {LessonBlockList} from "@/features/lessons/blocks";
import {hashCanonicalJson} from "@/lib/canonical-json";
it.each(["CIE-03","POR-02"] as const)("preserves original absent goals/mappings and every source field/Question while adding a labelled ungraded proposal (%s)",id=>{
 const {pack,source,anchor,recipe,blueprint}=sourceGoalFixture(id),before=hashCanonicalJson(pack),preview=createEnrichmentPreview(pack,blueprint,recipe);
 expect(source.objectives).toEqual([]);expect(anchor.conceptIds).toEqual([]);expect(preview.lesson.objectives).toEqual([]);expect(preview.lesson.activities).toEqual(source.activities);expect(hashCanonicalJson(pack)).toBe(before);
 expect(preview.lesson.blocks.filter(b=>source.blocks.some(old=>old.id===b.id))).toEqual(source.blocks);
 expect(preview.lesson.blocks.findIndex(b=>b.id===recipe.additions[0].newBlockId)).toBeLessThan(preview.lesson.blocks.findIndex(b=>b.id===anchor.id));
 expect(blueprint.reviewState).toBe("UNREVIEWED");expect(blueprint.learningGoal).toBeNull();expect((preview.newBlocks[0].payload as Record<string,unknown>).content).toContain("Objetivo proposto desta exploração:");
 const packet={schema:"caderno.lesson.v2",packId:`fixture.${id}.source-goal`,version:1,authorId:recipe.authorId,target:{trackId:pack.track.id,trackVersion:pack.version,moduleId:pack.track.modules.find(m=>m.lessons.some(l=>l.id===id))!.id,lessonId:id,baseVersion:source.version,baseHash:recipe.sourceLessonHash},lesson:preview.lesson,questionReferences:preview.questionReferences};
 expect(()=>resolveLessonVersionContext([pack],packet as never)).not.toThrow();
 const block=preview.newBlocks[0];const html=renderToStaticMarkup(<LessonBlockList blocks={[{stableId:block.id,type:block.type,payload:block.payload}]}/>);expect(html).toContain("Objetivo proposto");expect(html).not.toContain("Nota oficial");
});
it("rejects fabricated original goals, source quotes, links, observations and source changes",()=>{
 const {pack,source,recipe,blueprint}=sourceGoalFixture();
 const wrongGoal=structuredClone(recipe) as unknown as Record<string,unknown>;wrongGoal.additions=[{...recipe.additions[0],goalOrigin:"ORIGINAL_OBJECTIVE"}];expect(()=>createEnrichmentPreview(pack,blueprint,wrongGoal)).toThrow();
 const foreign=structuredClone(recipe);foreign.additions[0].conceptId="foreign";expect(()=>createEnrichmentPreview(pack,blueprint,foreign)).toThrow("Concept");
 const unsupported=structuredClone(recipe);unsupported.additions[0].parameters.observationQuote="Uma afirmação nova que não está no exemplo original.";expect(()=>createEnrichmentPreview(pack,blueprint,unsupported)).toThrow("quotes");
 const changed=structuredClone(pack);changed.track.modules.find(m=>m.lessons.some(l=>l.id===source.id))!.lessons.find(l=>l.id===source.id)!.objectives.push("Invented original goal");expect(()=>createEnrichmentPreview(changed,blueprint,recipe)).toThrow("source lesson hash");
});
