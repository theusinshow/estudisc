import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadBlueprintCorpus} from '../../tools/estudisc-content-studio/blueprint-sources';
import {createLessonBlueprint} from '../../tools/estudisc-content-studio/blueprint-policy';
import {createEnrichmentPreview} from '../../tools/estudisc-content-studio/enrichment';
import {predictionEnrichmentRecipeSchema} from '../../tools/estudisc-content-studio/enrichment-contracts';
import {resolveLessonVersionContext} from '@/features/import/application/lesson-version-policy';
import {LessonBlockList} from '@/features/lessons/blocks';
import {hashCanonicalJson} from '@/lib/canonical-json';
import {sourceGoalPredictionSchema} from '@/features/import/application/source-goal-prediction';

it.each([
 ['distance-displacement.v2.json','CIE-01','200 m','deslocamento final é zero'],
 ['inclined-plane.v2.json','CIE-02','distância do percurso','menor força'],
 ['convection.v2.json','CIE-04','mais quente no fundo tende a subir','Convecção térmica']
])('validates the source-defined prediction and preserved import context: %s',(file,id,observation,conclusion)=>{
 const recipe=predictionEnrichmentRecipeSchema.parse(JSON.parse(readFileSync(`tools/estudisc-content-studio/recipes/${file}`,'utf8')));
 const pack=loadBlueprintCorpus(process.cwd()).map(c=>c.pack).find(p=>p.track.modules.some(m=>m.lessons.some(l=>l.id===id)))!;
 const moduleRecord=pack.track.modules.find(m=>m.lessons.some(l=>l.id===id))!,source=moduleRecord.lessons.find(l=>l.id===id)!;
 const before=hashCanonicalJson(pack);
 const blueprint=createLessonBlueprint(pack,moduleRecord.subjectCode,source,{corpusHash:'a'.repeat(64),dependencyHash:'b'.repeat(64),policyHash:'c'.repeat(64),assetHash:'d'.repeat(64)},[],'2026-10-10T00:00:00Z');
 const preview=createEnrichmentPreview(pack,blueprint,recipe),addition=preview.newBlocks[0];
 const payload=sourceGoalPredictionSchema.parse(addition.payload);
 expect(payload.observation).toContain(observation);
 expect(payload.explanation).toContain(conclusion);
 expect(preview.lesson.objectives).toEqual([]);
 expect(preview.lesson.activities).toEqual(source.activities);
 expect(preview.lesson.blocks.filter(b=>source.blocks.some(s=>s.id===b.id))).toEqual(source.blocks);
 expect(preview.newBlocks).toHaveLength(1);
 expect(preview.questionReferences).toHaveLength(8);
 const packet={schema:'caderno.lesson.v2',packId:`fixture.science-prediction.${id.toLowerCase()}`,version:1,authorId:recipe.authorId,target:{trackId:pack.track.id,trackVersion:pack.version,moduleId:moduleRecord.id,lessonId:id,baseVersion:source.version,baseHash:recipe.sourceLessonHash},lesson:preview.lesson,questionReferences:preview.questionReferences};
 expect(()=>resolveLessonVersionContext([pack],packet as never)).not.toThrow();
 const html=renderToStaticMarkup(<LessonBlockList blocks={[{stableId:addition.id,type:addition.type,payload:addition.payload}]}/>);
 expect(html).toContain('Objetivo proposto desta exploração');
 expect(html).toContain(recipe.additions[0].parameters.title);
 expect(hashCanonicalJson(pack)).toBe(before);
});
