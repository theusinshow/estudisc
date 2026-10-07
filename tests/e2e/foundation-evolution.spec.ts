import { expect, test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";

test.describe("flagged study foundation", () => {
  test.skip(process.env.FEATURE_STUDY_PLANNER !== "true" || process.env.FEATURE_NEW_TODAY !== "true" || process.env.FEATURE_INTERACTIVE_LESSONS !== "true", "Run this suite with the study foundation flags enabled.");

  test("keeps five touch destinations, an accessible secondary sheet and keyboard tabs", async ({ page }) => {
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/plan");
      const primary = page.getByRole("navigation", { name: "Navegação principal", exact: true });
      await expect(primary.getByRole("link")).toHaveCount(5);
      for (const link of await primary.getByRole("link").all()) {
        const bounds = await link.boundingBox();
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    const trigger = page.getByRole("button", { name: "Abrir perfil e outras páginas" });
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Perfil e outras páginas" });
    await expect(sheet).toBeVisible();
    for (let index = 0; index < 16; index++) {
      await page.keyboard.press("Tab");
      expect(await sheet.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.getByRole("tab", { name: "Próximas sessões" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Concluídas" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("tabpanel")).toContainText("Você ainda não concluiu");
  });

  test("plans existing content, exits Focus without abandoning and resumes its frozen session", async ({ page, request }) => {
    const fixture = JSON.parse(JSON.stringify(source));
    fixture.questions.forEach((question: { status: string; exposurePolicy: { minimumDaysBetween: number } }) => {
      question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0;
    });
    fixture.track.modules.forEach((module: { lessons: { status: string }[] }) => module.lessons.forEach(lesson => { lesson.status = "published"; }));
    expect((await request.post("/api/import/track", { data: fixture })).ok()).toBeTruthy();
    await page.goto("/");
    await expect(page.locator(".study-action-card")).toBeVisible();
    await page.goto("/plan");
    await page.getByRole("button", { name: "Estudar 15 min" }).click();
    await page.getByRole("button", { name: "Começar sessão" }).click();
    const sessionUrl = page.url();
    await expect(page.getByRole("navigation", { name: "Navegação principal", exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Voltar para Hoje", exact: true }).click();
    await expect(page.locator(".study-action-card")).toContainText("Retomar sessão em andamento");
    await page.goto(sessionUrl);
    await expect(page.getByRole("button", { name: "Concluir sessão" })).toBeVisible();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(await page.locator(".study-action-card").evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  });
});
