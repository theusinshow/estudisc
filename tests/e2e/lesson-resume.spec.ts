import { expect, test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";

test("guards lesson resume writes behind the interactive rollout", async ({ request }) => {
  const result = await request.post("/api/lesson-resume", { data: {} });
  expect(result.status()).toBe(process.env.FEATURE_INTERACTIVE_LESSONS === "true" ? 400 : 404);
  if (process.env.FEATURE_INTERACTIVE_LESSONS === "true") expect((await request.post("/api/lesson-resume", { data: "x".repeat(60001), headers: { "Content-Type": "application/json" } })).status()).toBe(413);
});

test.describe("persisted lesson resume", () => {
  test.skip(process.env.FEATURE_INTERACTIVE_LESSONS !== "true", "Enable interactive lessons for resume acceptance.");
  test("restores steps, expanded view, unsent answers and canonical feedback with offline retry", async ({ page, request }, testInfo) => {
    test.setTimeout(60000);
    const fixture = structuredClone(source);
    fixture.questions.forEach(question => { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; });
    fixture.track.modules.forEach(moduleRecord => moduleRecord.lessons.forEach(lesson => { lesson.status = "published"; }));
    expect((await request.post("/api/import/track", { data: fixture })).ok()).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/lessons/CIE-06");
    await page.getByRole("button", { name: "Próximo", exact: true }).click();
    await expect(page.locator(".lesson-resume-controls")).toContainText("Ponto da aula salvo");
    await page.reload();
    await expect(page.locator(".stepper-count")).toContainText("Passo 2 de");
    await page.getByRole("button", { name: "Ver tudo", exact: true }).click();
    const question = page.locator(".learning-interaction").filter({ has: page.getByRole("heading", { name: source.questions.find(question => question.id === "Q-CIE-GOLDEN-4")!.stem, exact: true }) });
    await question.getByRole("textbox").fill("11");
    await page.getByRole("button", { name: "Salvar ponto da aula" }).click();
    await expect(page.locator(".lesson-resume-controls")).toContainText("Ponto da aula salvo");
    await page.reload();
    await expect(page.getByRole("button", { name: "Um passo por vez" })).toHaveAttribute("aria-pressed", "true");
    await expect(question.getByRole("textbox")).toHaveValue("11");
    await page.route("**/api/lesson-resume", route => route.abort());
    await question.getByRole("textbox").fill("12");
    await expect(page.locator(".lesson-resume-controls")).toContainText("Não foi possível salvar");
    await expect(question.getByRole("textbox")).toHaveValue("12");
    await page.unroute("**/api/lesson-resume");
    await page.getByRole("button", { name: "Salvar ponto da aula" }).click();
    await expect(page.locator(".lesson-resume-controls")).toContainText("Ponto da aula salvo");
    await page.reload(); await expect(question.getByRole("textbox")).toHaveValue("12");
    await question.getByRole("button", { name: "Ver uma dica" }).click();
    await expect(question.locator(".learning-hint")).toContainText("Dica 1");
    await page.reload(); await expect(question.locator(".learning-hint")).toContainText("Dica 1");
    await question.getByRole("textbox").fill("11");
    await question.getByRole("button", { name: "Enviar resposta" }).click();
    await expect(question.getByRole("status", { name: "Resultado da resposta" })).toContainText("Resposta correta");
    await expect(page.locator(".lesson-resume-controls")).toContainText("Ponto da aula salvo");
    await page.reload();
    await expect(question.getByRole("button", { name: "Resposta registrada" })).toBeDisabled();
    await expect(question.getByRole("status", { name: "Resultado da resposta" })).toContainText("Resposta correta");
    for (const width of [320, 360, 390, 430, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath(`lesson-resume-${width}.png`), caret: "initial" });
      const overflow = await page.evaluate(() => [...document.querySelectorAll("main *")].filter(element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.right > innerWidth + 1; }).slice(0, 6).map(element => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right })));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), JSON.stringify(overflow)).toBe(true);
      const button = await page.getByRole("button", { name: "Salvar ponto da aula" }).boundingBox();
      expect(button!.width).toBeGreaterThanOrEqual(44); expect(button!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("preserves a newer point when two tabs save the same revision", async ({ page, context }) => {
    await page.goto("/lessons/CIE-06");
    const other = await context.newPage(); await other.goto("/lessons/CIE-06");
    await page.getByRole("button", { name: "Um passo por vez" }).click();
    await expect(page.locator(".lesson-resume-controls")).toContainText("Ponto da aula salvo");
    await other.getByRole("button", { name: "Um passo por vez" }).click();
    await expect(other.locator(".lesson-resume-controls")).toContainText("Outra aba salvou um ponto mais recente");
    await other.getByRole("button", { name: "Recarregar aula" }).click();
    await expect(other.getByRole("button", { name: "Ver tudo" })).toHaveAttribute("aria-pressed", "false");
    await expect(other.locator(".stepper-count")).toContainText("Passo 2 de");
    await other.close();
  });
});
