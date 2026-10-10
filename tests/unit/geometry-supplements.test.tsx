import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadBlueprintCorpus} from '../../tools/estudisc-content-studio/blueprint-sources';
import {buildAuthoringPacket,authoringContextSchema} from '@/features/content-qa/authoring-contracts';
import {resolveLessonVersionContext} from '@/features/import/application/lesson-version-policy';
import {hashCanonicalJson} from '@/lib/canonical-json';
import {LessonBlockList} from '@/features/lessons/blocks';
import {numericExplorerSchema} from '@/features/lessons/blocks/numeric-explorer-schema';
import {NumericExplorer} from '@/features/lessons/blocks/numeric-explorer';
import type {TrackPackV2} from '@/features/import/application/track-pack-v2-schema';

type Blocks=TrackPackV2['track']['modules'][number]['lessons'][number]['blocks'];
const supplement=(file:string)=>JSON.parse(readFileSync(`tools/estudisc-content-studio/supplements/${file}`,'utf8')) as {lessonId:string;additions:Blocks;provenance:{noSourceTextOrAssetsCopied:boolean;officialMappingCertified:boolean;independentEditorialReviewRecorded:boolean}};

it.each([['circular-measures.v1.json',6],['rectangular-prism.v1.json',1]])('retains original fields/Questions and validates each authored geometry addition: %s',(file,count)=>{
 const spec=supplement(file),pack=loadBlueprintCorpus(process.cwd()).map(c=>c.pack).find(p=>p.track.modules.some(m=>m.lessons.some(l=>l.id===spec.lessonId)))!;
 const moduleRecord=pack.track.modules.find(m=>m.lessons.some(l=>l.id===spec.lessonId))!,source=moduleRecord.lessons.find(l=>l.id===spec.lessonId)!;
 const ids=[...new Set([...source.exitTicketQuestionIds,...source.activities.flatMap(a=>a.questionId?[a.questionId]:[])])];
 const context=authoringContextSchema.parse({authorId:'geometry-fixture-author',target:{trackId:pack.track.id,trackVersion:pack.version,moduleId:moduleRecord.id,lessonId:source.id,baseVersion:source.version,baseHash:hashCanonicalJson(source)},lesson:source,questionReferences:ids.map(id=>{const q=pack.questions.find(q=>q.id===id)!;return {id,version:q.version,hash:hashCanonicalJson(q)};}),published:true,findings:[]});
 const before=hashCanonicalJson(pack),packet=buildAuthoringPacket(context,spec.additions,`fixture.geometry.${source.id.toLowerCase()}`);
 expect(()=>resolveLessonVersionContext([pack],packet)).not.toThrow();
 expect(packet.lesson.blocks.slice(0,source.blocks.length)).toEqual(source.blocks);
 expect(packet.lesson.blocks).toHaveLength(source.blocks.length+count);
 expect(packet.lesson.activities).toEqual(source.activities);
 expect(packet.lesson.objectives).toEqual(source.objectives);
 expect(packet.lesson.concepts).toEqual(source.concepts);
 expect(packet.questionReferences).toEqual(context.questionReferences);
 expect(hashCanonicalJson(pack)).toBe(before);
 expect(spec.provenance).toMatchObject({noSourceTextOrAssetsCopied:true,officialMappingCertified:false,independentEditorialReviewRecorded:false});
 const html=renderToStaticMarkup(<LessonBlockList blocks={spec.additions.map(b=>({stableId:b.id,type:b.type,payload:b.payload}))}/>);
 expect(html).not.toContain('não pode ser exibido');
 expect(html).toContain(file.startsWith('circular')?'Circunferência':'Paralelepípedo');
});

it('keeps approximate circumference linear, labels the approximation and distinguishes square/cubic units',()=>{
 const circular=supplement('circular-measures.v1.json'),solid=supplement('rectangular-prism.v1.json');
 const explorer=circular.additions.find(b=>b.type==='numeric-explorer')!,config=numericExplorerSchema.parse(explorer.payload);
 if(config.mode!=='linear')throw Error('Expected the existing linear explorer');
 expect(config.unit).toBe('cm');expect(config.outputUnit).toBe('cm');
 expect(config.slope*5+config.intercept).toBeCloseTo(31.4,10);
 expect(config.slope*10+config.intercept).toBeCloseTo(62.8,10);
 expect(config.explanation).toContain('π ≈ 3,14');expect(config.explanation).toContain('não calcula a área');
 const text=circular.additions.map(b=>String(b.payload.content??'')).join('\n');
 expect(text).toContain('36π cm² ≈ 113,04 cm²');expect(text).toContain('12π cm ≈ 37,68 cm');
 // Independent exact decimal/rational checks for the authored worked solutions.
 expect(36*314/100).toBe(113.04);expect(12*314/100).toBe(37.68);
 expect(solid.additions[0].payload.content).toContain('30 × 20 × 10');
 expect(30*20*10/1000).toBe(6);
 expect(solid.additions[0].payload.content).toContain('capacidade interna é 6 L');
 const fallback=renderToStaticMarkup(<NumericExplorer {...config} enhanced={false}/>);
 expect(fallback).toContain('31,4');expect(fallback).not.toContain('type="range"');
});
