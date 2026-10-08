import { expect,test } from "@playwright/test";
import { reviewMistakeFixture } from "../fixtures/review-mistake-loop";
test("keeps targeted review entry points disabled before rollout",async({request})=>{
  test.skip(process.env.FEATURE_SMART_MISTAKES==="true","Checks flag off.");
  expect((await request.post("/api/study-sessions",{data:{action:"quick_review",budgetMinutes:10}})).status()).toBe(404);
});
test("observes a mistake, records an attributed reflection, retries another Question and preserves history",async({page,request},testInfo)=>{
  test.skip(process.env.FEATURE_SMART_MISTAKES!=="true","Enable smart mistakes for the loop.");test.setTimeout(90000);
  const imported=await request.post("/api/import/track",{data:reviewMistakeFixture()});expect(imported.ok(),await imported.text()).toBe(true);
  await page.goto("/lessons/REVIEW-MISTAKE-PILOT");await page.getByRole("button",{name:"Ver tudo",exact:true}).click();
  const first=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Quanto é 2 + 3 nesta fixture?",exact:true})});
  await first.getByRole("textbox").fill("999");
  const firstSubmit = first.getByRole("button", { name: "Enviar resposta", exact: true });
  if (testInfo.project.use.isMobile) await firstSubmit.tap(); else await firstSubmit.press("Enter");
  await expect(first.getByRole("status",{name:"Resultado da resposta"})).toContainText("Ainda não");
  await page.goto("/mistakes");await expect(page.getByText("Uma tentativa observada",{exact:true})).toBeVisible();await expect(page.getByText(/A resposta incorreta, sozinha, não identifica a causa/)).toBeVisible();
  await page.getByText("Registrar minha percepção",{exact:true}).click();
  await page.getByRole("combobox",{name:"O que você percebeu?"}).selectOption("calculation_error");
  await page.getByRole("textbox",{name:"Anotação opcional"}).fill("Somei sem conferir.");
  const saveReflection = page.getByRole("button",{name:"Registrar percepção",exact:true});
  if (testInfo.project.use.isMobile) await saveReflection.tap(); else await saveReflection.click();
  await expect(page.getByText(/Percepção registrada como relato seu/)).toBeVisible();
  await page.getByRole("button",{name:"Praticar outra questão",exact:true}).click();await page.waitForURL(/\/study\//);await page.getByRole("button",{name:"Começar sessão",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Quanto é 2 + 3 nesta fixture?",exact:true})).toHaveCount(0);
  const alternate=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Quanto é 3 + 4 nesta fixture?",exact:true})});
  await alternate.getByRole("textbox").fill("7");await alternate.getByRole("button",{name:"Enviar resposta",exact:true}).click();await expect(alternate.getByRole("status",{name:"Resultado da resposta"})).toContainText("Resposta correta");
  await page.goto("/mistakes");await expect(page.getByText(/1 registro ativo|1 erro ativo/)).toBeVisible();await page.getByText("Registros originais",{exact:true}).click();await expect(page.getByText(/Rever o raciocínio desta questão/)).toBeVisible();
  for(const width of [320,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:testInfo.outputPath(`mistake-loop-${width}.png`),fullPage:true});}
});
