import {expect,test} from "@playwright/test";
import {lessonVersionFixture} from "../fixtures/lesson-version-import";
test("searches existing lessons by title and actual area with keyboard/mobile recovery",async({page,request},testInfo)=>{
 test.skip(process.env.FEATURE_STUDY_PLANNER!=="true","Enhanced catalog is disabled");
 const {context,base}=lessonVersionFixture(true);const imported=await request.post("/api/import/track",{data:context});expect(imported.ok()).toBe(true);
 await page.goto("/tracks");const search=page.getByRole("searchbox",{name:"Buscar aulas"});await search.fill("termo-inexistente");await expect(page.getByRole("heading",{name:"Nenhuma aula encontrada"})).toBeVisible();await page.getByRole("button",{name:"Limpar filtros"}).click();
 await search.fill(base.title);await expect(page.getByRole("link",{name:new RegExp(base.title)}).first()).toHaveAttribute("href",`/lessons/${base.id}`);
 const area=page.getByRole("combobox",{name:"Área"});await area.selectOption({index:1});await search.focus();await page.keyboard.press("Tab");await expect(area).toBeFocused();
 for(const width of [320,360,390,430,1280]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);if(width<=430){await expect.poll(async()=>((await search.boundingBox())?.width??0)).toBeGreaterThan(220);await expect.poll(async()=>((await area.boundingBox())?.width??0)).toBeGreaterThan(220);}if(width===320||width===1280)await page.screenshot({path:testInfo.outputPath(`learning-catalog-${width}.png`),caret:"initial"});}
});
