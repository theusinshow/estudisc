import { expect,test,type Page } from "@playwright/test";
import { reviewMistakeFixture } from "../fixtures/review-mistake-loop";
const answers:Record<string,string>={"Quanto é 2 + 3 nesta fixture?":"5","Quanto é 3 + 4 nesta fixture?":"7"};
/** Answers the Question on screen; `wrong` sends a value that is never correct. Returns its stem. */
async function answerVisible(page:Page,wrong=false){
  const question=page.locator("section.learning-interaction:visible");
  const stem=(await question.getByRole("heading").first().textContent())?.trim()??"";
  await question.getByRole("textbox").fill(wrong?"999":answers[stem]);await question.getByRole("button",{name:"Enviar resposta",exact:true}).click();
  await expect(question.getByRole("status",{name:"Resultado da resposta"})).toContainText(wrong?"Ainda não":"Resposta correta");
  return stem;
}
test("keeps practice blocks disabled before rollout",async({request})=>{
  test.skip(process.env.FEATURE_SMART_MISTAKES==="true","Checks flag off.");
  expect((await request.post("/api/study-sessions",{data:{action:"practice_block",target:{kind:"review"}}})).status()).toBe(404);
});
test("observes a mistake, records a reflection, practises review and the mistake in blocks and preserves history",async({page,request},testInfo)=>{
  test.skip(process.env.FEATURE_SMART_MISTAKES!=="true","Enable smart mistakes for the loop.");test.setTimeout(120000);
  const pack=reviewMistakeFixture();const conceptId=pack.track.modules.flatMap(m=>m.lessons).find(l=>l.id==="REVIEW-MISTAKE-PILOT")!.concepts[0].id;
  const imported=await request.post("/api/import/track",{data:pack});expect(imported.ok(),await imported.text()).toBe(true);
  await page.goto("/lessons/REVIEW-MISTAKE-PILOT");await page.getByRole("button",{name:"Ver tudo",exact:true}).click();
  const first=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Quanto é 2 + 3 nesta fixture?",exact:true})});
  await first.getByRole("textbox").fill("999");
  const firstSubmit=first.getByRole("button",{name:"Enviar resposta",exact:true});
  if(testInfo.project.use.isMobile)await firstSubmit.tap();else await firstSubmit.press("Enter");
  await expect(first.getByRole("status",{name:"Resultado da resposta"})).toContainText("Ainda não");
  await page.goto("/mistakes");await expect(page.getByText("Errou uma vez",{exact:true})).toBeVisible();await expect(page.getByText(/Você errou 1 vez neste assunto/)).toBeVisible();
  await page.getByText("Registrar minha percepção",{exact:true}).click();
  await page.getByRole("combobox",{name:"O que você percebeu?"}).selectOption("calculation_error");
  await page.getByRole("textbox",{name:"Anotação opcional"}).fill("Somei sem conferir.");
  const saveReflection=page.getByRole("button",{name:"Registrar percepção",exact:true});
  if(testInfo.project.use.isMobile)await saveReflection.tap();else await saveReflection.click();
  await expect(page.getByText(/Percepção registrada como relato seu/)).toBeVisible();
  await expect(page.getByRole("combobox",{name:/Tempo/})).toHaveCount(0);

  // Revisão: both Questions of the Concept in one block; leaving mid-block resumes at the next Question.
  await page.goto("/review");await expect(page.getByRole("combobox",{name:/Tempo/})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Revisar agora",exact:true})).toBeVisible();
  await page.getByText("Ver a fila em lista",{exact:true}).click();
  await page.getByRole("list",{name:"Revisões vencidas"}).getByRole("listitem").filter({has:page.locator(`a[href="/concepts/${conceptId}"]`)}).getByRole("button",{name:/^Praticar /}).click();
  await page.waitForURL(/\/study\//);await expect(page.getByText("1 de 2",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:/Concluir sessão|Começar sessão/})).toHaveCount(0);
  await answerVisible(page,true);
  await page.getByRole("button",{name:"Próxima",exact:true}).click();await expect(page.getByText("2 de 2",{exact:true})).toBeVisible();
  const url=page.url();await page.reload();expect(page.url()).toBe(url);await expect(page.getByText("2 de 2",{exact:true})).toBeVisible();
  for(const width of [390,320]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.screenshot({path:testInfo.outputPath(`practice-block-${width}.png`),fullPage:true});}
  await answerVisible(page,true);
  await page.getByRole("button",{name:"Ver resumo",exact:true}).click();
  await expect(page.getByRole("heading",{name:"0 de 2 sem ajuda"})).toBeVisible();
  await expect(page.getByRole("list",{name:"Questões do bloco"}).getByRole("listitem")).toHaveCount(2);
  for(const width of [390,320]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.screenshot({path:testInfo.outputPath(`practice-summary-${width}.png`),fullPage:true});}
  await page.getByRole("link",{name:"Voltar",exact:true}).click();await expect(page).toHaveURL(/\/review$/);

  // Erros: the other Question only (the missed one stays out); a right answer without help corrects the mistakes.
  await page.goto("/mistakes");await page.getByRole("button",{name:"Praticar este assunto",exact:true}).click();
  await page.waitForURL(/\/study\//);await expect(page.getByText("1 de 1",{exact:true})).toBeVisible();
  await answerVisible(page);
  await page.getByRole("button",{name:"Ver resumo",exact:true}).click();await expect(page.getByRole("heading",{name:"1 de 1 sem ajuda"})).toBeVisible();
  await page.getByRole("link",{name:"Voltar",exact:true}).click();await expect(page).toHaveURL(/\/mistakes$/);
  await expect(page.getByText(/Já está corrigido\./)).toBeVisible();await page.getByText("Ver cada erro",{exact:true}).click();await expect(page.getByText(/· corrigido/).first()).toBeVisible();await expect(page.getByText(/· para corrigir/)).toHaveCount(0);
  for(const width of [320,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:testInfo.outputPath(`mistake-loop-${width}.png`),fullPage:true});}
});
