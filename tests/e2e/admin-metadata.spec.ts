import {expect,test} from "@playwright/test";
import {lessonVersionFixture} from "../fixtures/lesson-version-import";
import {createLessonBlueprint} from "../../tools/estudisc-content-studio/blueprint-policy";
test("searches validated ADMIN asset metadata and keeps unknown rights unavailable",async({page},testInfo)=>{
 test.skip(process.env.FEATURE_CONTENT_HEALTH!=="true","Admin metadata rollout is disabled");
 await page.goto("/admin/content-studio");
 const metadata={images:[{id:"unknown-image",title:"Diagrama de células",sourceType:"HUMAN_CREATED",sourceOrganization:"Autor",license:"Não verificada",attribution:"Autor",licenseStatus:"UNKNOWN",recommendedUse:"Consultar",altTextDraft:"Descrição suficiente da figura"}],videos:[],books:[]};
 await page.getByLabel("Media pack de assets").setInputFiles({name:"media-pack.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(metadata))});
 const assets=page.getByRole("region",{name:"Assets validados"});await expect(assets.getByRole("heading",{name:"Diagrama de células"})).toBeVisible();await expect(assets.getByText(/Reutilização: indisponível/)).toBeVisible();
 const search=assets.getByRole("searchbox",{name:"Buscar assets"});await search.fill("celulas");await expect(assets.getByRole("heading",{name:"Diagrama de células"})).toBeVisible();await search.focus();await page.keyboard.press("Tab");const reuse=assets.getByRole("checkbox",{name:"Somente reutilização elegível"});await expect(reuse).toBeFocused();await reuse.check();await expect(assets.getByText("Nenhum asset encontrado com estes filtros.")).toBeVisible();await reuse.uncheck();
 for(const width of [320,360,390,430,1280]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);expect((await assets.locator(".learning-check").boundingBox())?.height).toBeGreaterThanOrEqual(44);if(width===320||width===1280)await page.screenshot({path:testInfo.outputPath(`admin-assets-${width}.png`),caret:"initial"});}
});

test("matches an actual source blueprint without marking the proposal reviewed",async({page,request})=>{
 test.skip(process.env.FEATURE_CONTENT_HEALTH!=="true","Admin metadata rollout is disabled");
 const {context,base}=lessonVersionFixture(true);expect((await request.post("/api/import/track",{data:context})).ok()).toBe(true);
 const moduleRecord=context.track.modules.find(m=>m.lessons.some(l=>l.id===base.id))!;
 const blueprint=createLessonBlueprint(context,moduleRecord.subjectCode,base,{corpusHash:"a".repeat(64),dependencyHash:"b".repeat(64),policyHash:"c".repeat(64),assetHash:"d".repeat(64)},[],"2026-10-08T00:00:00Z");
 await page.goto(`/admin/content-studio?lessonId=${base.id}`);await page.getByRole("button",{name:"Carregar fonte"}).click();await expect(page.getByRole("heading",{name:"Adicionar bloco na próxima versão"})).toBeVisible();
 await page.getByLabel("Lesson blueprint",{exact:true}).setInputFiles({name:"lesson-blueprint.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(blueprint))});
 const view=page.getByRole("region",{name:"Blueprint validado"});await expect(view.getByText(/Vínculo.*corresponde/)).toBeVisible();await expect(view.getByText(/UNREVIEWED/)).toBeVisible();
 const stale=structuredClone(blueprint);stale.identity.lessonVersion++;await page.getByLabel("Lesson blueprint",{exact:true}).setInputFiles({name:"stale-blueprint.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(stale))});await expect(view.getByText(/Vínculo.*não confirmado/)).toBeVisible();
});
