import {expect,test} from "@playwright/test";
import {sourceGoalFixture} from "../fixtures/source-goal-enrichment";
import {createEnrichmentPreview} from "../../tools/estudisc-content-studio/enrichment";
test("predicts from a source-derived proposed goal, resumes ungraded state and preserves official evidence/history",async({page,request},testInfo)=>{
 test.skip(process.env.FEATURE_INTERACTIVE_LESSONS!=="true","Interactive prediction is disabled");
 const {pack,source,recipe,blueprint,moduleRecord}=sourceGoalFixture("CIE-03",true),preview=createEnrichmentPreview(pack,blueprint,recipe);
 // Disposable standalone published fixture uses the canonical track importer.
 const fixture=structuredClone(pack);const lesson=fixture.track.modules.find(m=>m.id===moduleRecord.id)!.lessons.find(l=>l.id===source.id)!;lesson.blocks=preview.lesson.blocks;
 expect((await request.post("/api/import/track",{data:fixture})).ok()).toBe(true);
 const before=await(await request.get("/api/export?type=backup")).json();
 await page.goto(`/lessons/${source.id}`);await page.getByRole("button",{name:"Ver tudo",exact:true}).click();
 const prediction=page.getByRole("region",{name:"Preveja o equilíbrio térmico"});await expect(prediction.getByText(/Objetivo proposto desta exploração/)).toBeVisible();await prediction.getByRole("textbox",{name:"Sua previsão"}).fill("A lata recebe energia térmica até se aproximar da temperatura da sala.");await prediction.getByRole("button",{name:"Observar",exact:true}).click();await prediction.getByRole("button",{name:"Conferir explicação"}).click();await expect(prediction.getByText("Esta previsão é exploratória. As questões registram sua prática.")).toBeVisible();
 await expect(page.locator(".lesson-resume-controls")).toContainText("Ponto da aula salvo");await page.reload();await expect(page.getByRole("region",{name:"Preveja o equilíbrio térmico"}).getByRole("textbox",{name:"Sua previsão"})).toHaveValue("A lata recebe energia térmica até se aproximar da temperatura da sala.");
 const after=await(await request.get("/api/export?type=backup")).json();expect(after.payload.recentAttempts).toEqual(before.payload.recentAttempts);expect(after.payload.masteryEvidence).toEqual(before.payload.masteryEvidence);
 for(const width of [320,360,390,430,1280]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);if(width===320||width===1280)await page.screenshot({path:testInfo.outputPath(`source-goal-prediction-${width}.png`),caret:"initial"});}
});
