import { expect,test } from "@playwright/test";
import { reviewMistakeFixture } from "../fixtures/review-mistake-loop";
test("keeps the existing hierarchy without loading the interactive canvas before rollout",async({page})=>{
  test.skip(process.env.FEATURE_KNOWLEDGE_MAP==="true","Checks flag off.");await page.goto("/knowledge-map");await expect(page.getByRole("button",{name:"Abrir mapa interativo"})).toHaveCount(0);await expect(page.getByText(/não depende de canvas/)).toBeVisible();
});
test("loads a read-only map on demand with an accessible list and keyboard/touch details",async({page,request},testInfo)=>{
  test.skip(process.env.FEATURE_KNOWLEDGE_MAP!=="true","Enable map.");test.setTimeout(90000);
  const fixture=reviewMistakeFixture();fixture.packId+=".knowledge";fixture.track.id+="-knowledge";expect((await request.post("/api/import/track",{data:fixture})).ok()).toBe(true);
  const loaded:string[]=[];page.on("request",r=>{if(r.url().includes("knowledge-flow"))loaded.push(r.url());});
  await page.goto("/knowledge-map");await expect(page.getByRole("list",{name:"Conceitos por área"})).toBeVisible();expect(loaded).toHaveLength(0);
  const first=page.getByRole("list",{name:"Conceitos por área"}).getByRole("button").first();await first.press("Enter");await expect(page.getByRole("dialog")).toBeVisible();await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button",{name:"Abrir mapa interativo",exact:true}).click();await expect(page.getByRole("region",{name:"Mapa interativo de conceitos"})).toBeVisible();await expect(page.locator(".react-flow__node").first()).toBeVisible();expect(loaded.length).toBeGreaterThan(0);
  const node=page.locator(".react-flow__node").first().getByRole("button");if(testInfo.project.use.isMobile)await node.tap();else await node.press("Enter");await expect(page.getByRole("dialog")).toBeVisible();await page.keyboard.press("Escape");
  for(const width of [320,360,390,430,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);if(width===320||width===1280)await page.screenshot({path:testInfo.outputPath(`knowledge-${width}.png`)});}
});
test("retains the Concept list when the optional canvas chunk fails",async({page,request})=>{
  test.skip(process.env.FEATURE_KNOWLEDGE_MAP!=="true","Enable map.");
  const fixture=reviewMistakeFixture();fixture.packId+=".knowledge";fixture.track.id+="-knowledge";expect((await request.post("/api/import/track",{data:fixture})).ok()).toBe(true);
  await page.route("**/*knowledge-flow*",route=>route.abort());await page.goto("/knowledge-map");
  await page.getByRole("button",{name:"Abrir mapa interativo",exact:true}).click();await expect(page.getByRole("alert").filter({hasText:"Use a lista"})).toBeVisible();await expect(page.getByRole("list",{name:"Conceitos por área"})).toBeVisible();
});
