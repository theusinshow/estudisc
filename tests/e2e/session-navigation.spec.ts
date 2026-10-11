import { expect, test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";

test("opens session mutations as documents and resumes the existing session from Plan", async ({ page, request }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", error => browserErrors.push(error.message));
  const fixture = structuredClone(source);
  fixture.questions.forEach(question => { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; });
  fixture.track.modules.forEach(module => module.lessons.forEach(lesson => { lesson.status = "published"; }));
  expect((await request.post("/api/import/track", { data: fixture })).ok()).toBe(true);
  const planner = process.env.FEATURE_STUDY_PLANNER === "true";
  const adaptive = process.env.FEATURE_ADAPTIVE_SESSION === "true";
  await page.goto(planner ? "/plan" : "/");
  if (planner) {
    await expect(page.getByText(/Selecione pelo menos um dia para habilitar Continuar/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
  }
  const documents: string[] = [];
  page.on("request", req => { if (req.isNavigationRequest() && new URL(req.url()).pathname.startsWith("/study/")) documents.push(req.url()); });
  await expect(page.getByRole("button", { name: `Estudar ${adaptive ? 10 : 15} min`, exact: true })).toBeEnabled({ timeout: 15000 });
  await page.getByRole("button", { name: `Estudar ${adaptive ? 10 : 15} min`, exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: `Estudar ${adaptive ? 10 : 15} min`, exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Começar sessão" })).toBeVisible();
  const sessionUrl = page.url();
  const [started] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith("/api/study-sessions") && response.request().method() === "POST"),
    page.getByRole("button", { name: "Começar sessão" }).click()
  ]);
  expect(started.status()).toBe(200);
  await expect(page.getByRole("button", { name: "Concluir sessão" })).toBeVisible();
  expect(page.url()).toBe(sessionUrl);
  if (planner) {
    await page.goto("/plan");
    const link = page.getByRole("link", { name: "Abrir sessão", exact: true });
    await link.evaluate(element => element.scrollIntoView({ block: "center" }));
    await link.click();
    await expect(page.getByRole("button", { name: "Concluir sessão" })).toBeVisible();
    expect(page.url()).toBe(sessionUrl);
    await page.goto("/plan");
    const budget = page.getByRole("button", { name: adaptive ? "20 min" : "30 min", exact: true });
    await budget.evaluate(element => element.scrollIntoView({ block: "center" }));
    await budget.click();
    await expect(page.getByRole("button", { name: "Concluir sessão" })).toBeVisible();
    expect(page.url()).toBe(sessionUrl);
  }
  await page.getByRole("button", { name: "Concluir sessão" }).click();
  await expect(page.getByRole("region", { name: "Resultado da sessão" })).toContainText("0 questões respondidas");
  expect(documents.length).toBeGreaterThanOrEqual(planner ? 5 : 3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(browserErrors).toEqual([]);
});
