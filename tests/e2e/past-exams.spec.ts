import { expect,test } from "@playwright/test";
import { sheetTemplateInput } from "../unit/past-exam-fixture";
test("lists, answers, resumes and corrects a past-exam answer sheet",async({page,request},testInfo)=>{
  test.setTimeout(90000);const tag=testInfo.project.name;const base=sheetTemplateInput();
  const free=sheetTemplateInput({id:`e2e-past-${tag}-2025-1`,title:`Prova 2025.1 ${tag}`});
  const reserved=sheetTemplateInput({id:`e2e-past-${tag}-2026-1`,title:`Prova 2026.1 ${tag}`,availableAt:"2099-01-01T03:00:00.000Z",exam:{...base.exam,examId:"ifsc-integrado-2026-1",edition:"2026.1",year:2026}});
  for(const template of [free,reserved])expect((await request.post("/api/admin/assessment-templates",{data:template})).ok()).toBe(true);
  await page.goto("/past-exams");
  const reservedCard=page.locator(".past-exam-card",{hasText:`Prova 2026.1 ${tag}`});await expect(reservedCard.getByText(/Simulado reservado/)).toBeVisible();await expect(reservedCard.getByRole("link")).toHaveCount(0);
  const card=page.locator(".past-exam-card",{hasText:`Prova 2025.1 ${tag}`});await expect(card.getByRole("link",{name:"Caderno oficial"})).toHaveAttribute("href",/www\.ifsc\.edu\.br/);await expect(card.getByRole("link",{name:"Gabarito oficial"})).toHaveCount(0);
  for(const width of [320,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.screenshot({path:testInfo.outputPath(`past-exams-${width}.png`)});}
  await card.getByRole("button",{name:"Responder"}).click();await page.waitForURL(/\/assessments\//);
  await page.getByRole("radio",{name:"Questão 1, alternativa A"}).check();
  await page.getByRole("radio",{name:"Questão 8, alternativa A"}).focus();await page.keyboard.press("ArrowRight");await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio",{name:"Questão 8, alternativa C"})).toBeChecked();
  await page.getByRole("checkbox",{name:"Revisar questão 2 depois"}).check();
  await expect(page.getByText("2/28 respondidas")).toBeVisible();await expect(page.getByText("Salvando…")).toHaveCount(0);
  await page.reload();await expect(page.getByRole("radio",{name:"Questão 1, alternativa A"})).toBeChecked();await expect(page.getByRole("radio",{name:"Questão 8, alternativa C"})).toBeChecked();await expect(page.getByRole("checkbox",{name:"Revisar questão 2 depois"})).toBeChecked();
  for(const width of [320,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.screenshot({path:testInfo.outputPath(`answer-sheet-${width}.png`)});}
  await page.getByRole("button",{name:"Conferir e finalizar"}).click();await expect(page.getByText(/Em branco: 2, 3, 4/)).toBeVisible();await expect(page.getByText("Marcadas para revisar: 2.")).toBeVisible();
  await page.getByRole("button",{name:"Finalizar prova"}).click();
  await expect(page.getByRole("heading",{name:"Seu resultado"})).toBeVisible();await expect(page.getByLabel("Pontuação")).toContainText("2/27");
  await expect(page.getByRole("row",{name:/^15 /})).toContainText("Anulada");
  for(const width of [320,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.screenshot({path:testInfo.outputPath(`sheet-result-${width}.png`)});}
  await page.goto("/past-exams");await expect(card.getByRole("link",{name:"Gabarito oficial"})).toBeVisible();await expect(card.getByRole("button",{name:"Refazer"})).toBeVisible();
});
