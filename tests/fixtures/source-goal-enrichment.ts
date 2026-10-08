import {loadBlueprintCorpus} from "../../tools/estudisc-content-studio/blueprint-sources";
import {createLessonBlueprint} from "../../tools/estudisc-content-studio/blueprint-policy";
import {predictionEnrichmentRecipeSchema} from "../../tools/estudisc-content-studio/enrichment-contracts";
import {hashCanonicalJson} from "@/lib/canonical-json";
export function sourceGoalFixture(lessonId:"CIE-03"|"POR-02"="CIE-03",publishedFixture=false){
 const pack=loadBlueprintCorpus(process.cwd()).map(c=>c.pack).find(p=>p.track.modules.some(m=>m.lessons.some(l=>l.id===lessonId)))!;
 const moduleRecord=pack.track.modules.find(m=>m.lessons.some(l=>l.id===lessonId))!,source=moduleRecord.lessons.find(l=>l.id===lessonId)!;
 // Disposable memory harness only; this does not create production/editorial approvals.
 if(publishedFixture){source.status="published";pack.questions.forEach(q=>{q.status="published";});}
 const anchor=source.blocks.find(b=>b.type==="worked-example")!,text=String(anchor.payload.content),paragraphs=text.split("\n\n");
 const conceptId=source.concepts.find(c=>c.title===(lessonId==="CIE-03"?"Equilíbrio térmico":"ideia principal"))!.id;
 const identity={trackId:pack.track.id,trackVersion:pack.version,lessonId:source.id,lessonVersion:source.version};
 const proposedGoal=lessonId==="CIE-03"?"Prever a transferência de energia térmica até o equilíbrio, distinguindo calor de temperatura.":"Identificar tema e ideia principal, distinguindo informação explícita de uma conclusão sobre o movimento total da biblioteca.";
 const recipe=predictionEnrichmentRecipeSchema.parse({schemaVersion:2,identity,sourceLessonHash:hashCanonicalJson(source),newVersion:source.version+1,authorId:"fixture-author",selectionBasis:"source_goal_exception",exceptionReason:"Objetivos originais e vínculos do exemplo estão ausentes; a proposta deriva deste exemplo autoral preservado.",additions:[{newBlockId:`${source.id}-source-prediction-v${source.version+1}`,beforeBlockId:anchor.id,sourceBlockHash:hashCanonicalJson(anchor),sourceQuote:text,conceptId,purpose:"exploration",type:"prediction",goalOrigin:"SOURCE_DERIVED_PROPOSAL",proposedGoal,parameters:{title:lessonId==="CIE-03"?"Preveja o equilíbrio térmico":"Antecipe a ideia principal",promptQuote:paragraphs[0],observationQuote:text,explanationQuote:paragraphs.slice(1).join("\n\n")}}]});
 const blueprint=createLessonBlueprint(pack,moduleRecord.subjectCode,source,{corpusHash:"a".repeat(64),dependencyHash:"b".repeat(64),policyHash:"c".repeat(64),assetHash:"d".repeat(64)},[],"2026-10-08T00:00:00Z");
 return {pack,moduleRecord,source,anchor,recipe,blueprint};
}
