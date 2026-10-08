import { expect,test } from "@playwright/test";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
test("uses source-bound next-version preview/import and retains published source in ADMIN workbench",async({page,request},testInfo)=>{
  test.skip(process.env.FEATURE_CONTENT_HEALTH!=="true","Enable workbench.");test.setTimeout(90000);
  const {context,base}=lessonVersionFixture(true);expect((await request.post("/api/import/track",{data:context})).ok()).toBe(true);
  await page.goto(`/admin/content-studio?lessonId=${base.id}`);await page.getByRole("button",{name:"Carregar fonte",exact:true}).click();await expect(page.getByRole("heading",{name:"Adicionar bloco na próxima versão",exact:true})).toBeVisible();
  await page.getByRole("textbox",{name:"Conteúdo do bloco"}).fill("Nota adicional da fixture, com fonte preservada.");await page.getByRole("button",{name:"Preparar rascunho",exact:true}).click();await expect(page.getByRole("button",{name:"Importar rascunho",exact:true})).toBeDisabled();await page.getByRole("button",{name:"Validar prévia",exact:true}).click();await expect(page.getByRole("status")).toContainText("Prévia validada");await page.getByRole("button",{name:"Importar rascunho",exact:true}).click();await expect(page.getByRole("status")).toContainText("Rascunho importado");
  const original=await request.get(`/lessons/${base.id}?version=${base.version}`);expect(original.ok()).toBe(true);expect(await original.text()).not.toContain("Nota adicional da fixture");
  const next=await request.get(`/lessons/${base.id}?version=${base.version+1}`);expect(next.ok()).toBe(true);expect(await next.text()).toContain("Nota adicional da fixture");
  for(const width of [320,360,390,430,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);if(width===320||width===1280)await page.screenshot({path:testInfo.outputPath(`admin-workbench-${width}.png`)});}
});
