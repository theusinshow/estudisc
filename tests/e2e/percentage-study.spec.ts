import { expect,test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
test("studies percentage on mobile and resumes a frozen session",async({page,request})=>{
  const fixture=JSON.parse(JSON.stringify(source));fixture.questions.forEach((question:{status:string;exposurePolicy:{minimumDaysBetween:number}})=>{question.status="published";question.exposurePolicy.minimumDaysBetween=0;});fixture.track.modules[0].lessons.forEach((lesson:{status:string})=>lesson.status="published");
  const imported=await request.post("/api/import/track",{data:fixture});expect(imported.ok()).toBeTruthy();
  await page.goto("/");await page.getByRole("button",{name:"Estudar 15 min"}).click();await page.getByRole("button",{name:"Começar sessão"}).click();
  for(const [stem,value] of [["Escreva 1/2 em decimal.","0,5"],["Escreva 0,75 como porcentagem. Informe apenas o número antes do símbolo %.","75"],["Uma receita usa 3 copos de farinha para cada 2 copos de água. Mantendo a proporção, quantos copos de água serão usados com 6 copos de farinha?","4"]]){const exercise=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:stem,exact:true})});await exercise.getByLabel("Valor",{exact:true}).fill(value);await exercise.getByRole("button",{name:"Enviar resposta"}).click();await expect(exercise.getByRole("status")).toContainText("Resposta correta");}
  await page.getByRole("button",{name:"Concluir sessão"}).click();await page.goto("/");await page.getByRole("button",{name:"Estudar 15 min"}).click();await page.getByRole("button",{name:"Começar sessão"}).click();
  const url=page.url();await expect(page.getByRole("heading",{name:"Explore a porcentagem"})).toBeVisible();
  const exercise=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Calcule 20% de 150.",exact:true})});
  await exercise.getByLabel("Valor",{exact:true}).fill("30");await exercise.getByRole("button",{name:"Enviar resposta"}).click();await expect(exercise.getByRole("status")).toContainText("Resposta correta");
  const button=await exercise.getByRole("button",{name:"Enviar resposta"}).boundingBox();expect(button!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.reload();expect(page.url()).toBe(url);await expect(page.getByRole("heading",{name:"Explore a porcentagem"})).toBeVisible();
  await page.getByRole("button",{name:"Concluir sessão"}).click();await expect(page.getByRole("heading",{name:"Seu estudo de hoje"})).toBeVisible();await expect(page.getByText(/1 questões respondidas/)).toBeVisible();
});
