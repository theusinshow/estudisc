// @vitest-environment node
import { existsSync,readFileSync } from "node:fs";
import { expect,it } from "vitest";
import { importTrackPack,validateTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { DrizzleCurriculumRepository } from "@/db/repositories/curriculum-repository";
import { QuestionAssetRepository } from "@/db/repositories/question-asset-repository";
import { AssessmentRepository } from "@/db/repositories/assessment-repository";
import { tracks } from "@/db/schema";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
const file=".local/ifsc-official/track.source-pack.v2.json";
it.skipIf(!existsSync(file))("imports the complete private inventory without claiming teaching coverage or exposing a source asset",async()=>{
  const pack=JSON.parse(readFileSync(file,"utf8")),validation=validateTrackPack(pack);expect(validation.ok,JSON.stringify(!validation.ok&&validation.issues)).toBe(true);
  const database=await createMigratedPgliteTestDatabase();try{
    expect((await importTrackPack(pack,new DrizzleTrackImportRepository(database.db,"author"))).status).toBe("imported");
    const [track]=await database.db.select().from(tracks);const coverage=await new DrizzleCurriculumRepository(database.db).getCoverage(track.id);
    expect(coverage.summary).toMatchObject({total:27,mappedPercent:100,validatedPercent:0,complete:false});
    const bank=JSON.parse(readFileSync(".local/ifsc-official/bank.draft.json","utf8")),asset=bank.assets[0];const bytes=readFileSync(`.local/ifsc-official/${asset.file}`),assets=new QuestionAssetRepository(database.db);
    await assets.importAsset(asset.questionId,asset.version,asset.id,bytes);
    expect((await assets.readAuthorized(asset.id,{ownerId:"author",role:"ADMIN"}))?.contentHash).toBe(asset.sha256);
    expect(await assets.readAuthorized(asset.id,{ownerId:"student",role:"STUDENT"})).toBeNull();
    const templates=JSON.parse(readFileSync(".local/ifsc-official/assessment-templates.draft.json","utf8"));
    for(const template of templates)await new AssessmentRepository(database.db).importTemplate(template);
  }finally{await database.close();}
},30000);
