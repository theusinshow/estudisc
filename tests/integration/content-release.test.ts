import { expect,it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { DrizzleQuestionRepository } from "@/db/repositories/question-repository";
import { qaLayers } from "@/features/content-qa/policy";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";
it("locks an immutable author/hash, requires four independent layers, and reuses unchanged versions",async()=>{
  const database=await createMigratedPgliteTestDatabase();try{
    const fixture=structuredClone(source);
    expect((await importTrackPack(fixture,new DrizzleTrackImportRepository(database.db,"author"))).status).toBe("imported");
    const repo=new ContentQaRepository(database.db);const release=(await repo.list()).find(r=>r.stableId==="Q-MAT-GOLDEN-3")!;
    const review={layer:"FACTUAL",verdict:"APPROVE",rationale:"Disposable fixture validates release policy only.",findings:[]};
    // ADR 0033: the generated item is attributed to its AI authoring run, not to the importer.
    expect(release.authorId).toBe("ai:ifsc-golden-author-v1");
    await expect(repo.review("ai:ifsc-golden-author-v1",release.id,review)).rejects.toThrow("Independent");
    await expect(repo.publish(release.id)).rejects.toThrow("QA blocks");
    for(const layer of qaLayers)await repo.review("reviewer",release.id,{...review,layer});
    expect(await repo.publish(release.id)).toEqual({published:true});
    expect((await new DrizzleQuestionRepository(database.db).getVersion("Q-MAT-GOLDEN-3",1))?.question.status).toBe("published");
    await repo.review("reviewer",release.id,{...review,verdict:"REJECT",findings:[{severity:"CRITICAL",message:"Disposable regression: withdrawn content"}]});
    expect((await new DrizzleQuestionRepository(database.db).getVersion("Q-MAT-GOLDEN-3",1))?.question.status).toBe("retired");
    await expect(repo.publish(release.id)).rejects.toThrow("Retired");
    fixture.version+=1;expect((await importTrackPack(fixture,new DrizzleTrackImportRepository(database.db,"other-admin"))).status).toBe("imported");
    const changed=structuredClone(fixture);changed.version+=1;changed.questions[2].stem="Different immutable content";
    await expect(importTrackPack(changed,new DrizzleTrackImportRepository(database.db,"author"))).rejects.toThrow();
  }finally{await database.close();}
},30000);
