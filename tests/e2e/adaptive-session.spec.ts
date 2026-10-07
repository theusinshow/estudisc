import { expect, test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";

test("keeps invalid budgets and disabled adaptive budgets outside the API contract", async ({ request }) => {
  expect((await request.post("/api/study-sessions", { data: { action: "plan", budgetMinutes: 5 } })).status()).toBe(400);
  if (process.env.FEATURE_ADAPTIVE_SESSION !== "true") for (const budgetMinutes of [10, 20, 45]) expect((await request.post("/api/study-sessions", { data: { action: "plan", budgetMinutes } })).status()).toBe(400);
});

test("runs a short shared Question session, resumes Focus and reports only recorded facts", async ({ page, request }, testInfo) => {
  test.skip(process.env.FEATURE_ADAPTIVE_SESSION !== "true" || process.env.FEATURE_STUDY_PLANNER !== "true" || process.env.FEATURE_NEW_TODAY !== "true" || process.env.FEATURE_INTERACTIVE_LESSONS !== "true", "Enable adaptive and foundation flags for acceptance.");
  const fixture = structuredClone(source);
  fixture.questions.forEach(question => { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; });
  fixture.track.modules.forEach(moduleRecord => moduleRecord.lessons.forEach(lesson => { lesson.status = "published"; }));
  expect((await request.post("/api/import/track", { data: fixture })).ok()).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/plan");
    for (const name of ["Estudar 10 min", "20 min", "30 min", "45 min"]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toBeEnabled();
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`adaptive-plan-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Estudar 10 min", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Começar sessão" }).click();
  const sessionUrl = page.url();
  await expect(page.getByRole("navigation", { name: "Navegação principal", exact: true })).toHaveCount(0);
  await expect(page.getByText("Não há registro completo de QA independente para esta versão.", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".session-lesson .learning-interaction").first()).toBeVisible();
  for (const width of [320, 360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await page.locator(".session-plan li > span").first().evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`adaptive-active-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Voltar para Hoje", exact: true }).click();
  await expect(page.locator(".study-action-card")).toContainText("Retomar sessão em andamento");
  await page.goto(sessionUrl); await page.reload();
  await expect(page.getByRole("button", { name: "Concluir sessão" })).toBeVisible();
  await page.getByRole("button", { name: "Concluir sessão" }).click();
  await expect(page.getByRole("region", { name: "Resultado da sessão" })).toContainText("0 questões respondidas");
  await expect(page.getByRole("region", { name: "Resumo factual" })).toContainText("orçamento de 10 min");
  await expect(page.getByRole("region", { name: "Resumo factual" })).toContainText("incluindo pausas");
  await expect(page.getByText("Prática independente registrada:", { exact: false })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("adaptive-summary.png"), fullPage: true });
});
