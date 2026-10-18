import { expect,test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
test("studies percentage on mobile through its lessons and keeps answers after reload",async({page,request})=>{
  const fixture=JSON.parse(JSON.stringify(source));fixture.questions.forEach((question:{status:string;exposurePolicy:{minimumDaysBetween:number}})=>{question.status="published";question.exposurePolicy.minimumDaysBetween=0;});fixture.track.modules[0].lessons.forEach((lesson:{status:string})=>lesson.status="published");
  const imported=await request.post("/api/import/track",{data:fixture});expect(imported.ok()).toBeTruthy();
  const openAll=async()=>{await page.getByRole("button",{name:"Ver tudo"}).first().waitFor();for(const toggle of await page.getByRole("button",{name:"Ver tudo"}).all())await toggle.click();};
  await page.goto("/lessons/MAT-PREREQ");await openAll();
  await expect(page.getByRole("img", {name:"Barra dividida em dez partes iguais, das quais três estão destacadas."})).toBeVisible();
  for(const [stem,value] of [["Qual número decimal representa 1/4?","0,25"],["Uma estudante completou 0,4 de uma lista de exercícios. Que porcentagem da lista ela completou?","40%"],["Uma receita usa 2 copos de leite para cada 5 colheres de açúcar. Mantendo a proporção, quantas colheres de açúcar serão usadas com 6 copos de leite?","15"]]){const exercise=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:stem,exact:true})});await exercise.getByRole("radio",{name:value,exact:true}).check();await exercise.getByRole("button",{name:"Enviar resposta"}).click();await expect(exercise.getByRole("status",{name:"Resultado da resposta"})).toContainText("Resposta correta");}
  await page.goto("/lessons/MAT-07");const url=page.url();await openAll();await expect(page.getByRole("heading",{name:"Explore a porcentagem"})).toBeVisible();
  const exercise=page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Calcule 20% de 150.",exact:true})});
  await exercise.getByRole("textbox").fill("30");await exercise.getByRole("button",{name:"Enviar resposta"}).click();await expect(exercise.getByRole("status",{name:"Resultado da resposta"})).toContainText("Resposta correta");
  await expect(exercise.getByRole("button",{name:"Resposta registrada"})).toBeDisabled();const button=await exercise.getByRole("button",{name:"Resposta registrada"}).boundingBox();expect(button!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.reload();expect(page.url()).toBe(url);await openAll();
  await expect(page.locator("section.learning-interaction").filter({has:page.getByRole("heading",{name:"Calcule 20% de 150.",exact:true})}).getByRole("status",{name:"Resultado da resposta"})).toContainText("Resposta correta");
});
