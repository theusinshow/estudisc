import { expect, test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";

test.describe("continuous study flow (ADR 0060)", () => {
  test.skip(process.env.FEATURE_CONTINUOUS_STUDY !== "true" || process.env.FEATURE_NEW_TODAY !== "true" || process.env.FEATURE_INTERACTIVE_LESSONS !== "true", "Enable the continuous study, new Today and interactive lesson rollouts.");
  test("opens a whole lesson from Today and resumes it after leaving mid-way", async ({ page, request }) => {
    test.setTimeout(60000);
    const fixture = structuredClone(source);
    fixture.questions.forEach(question => { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; });
    fixture.track.modules.forEach(moduleRecord => moduleRecord.lessons.forEach(lesson => { lesson.status = "published"; }));
    expect((await request.post("/api/import/track", { data: fixture })).ok()).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Continuar estudando" })).toBeVisible();
    await expect(page.getByText("Quanto tempo tem para estudar agora?")).toHaveCount(0);
    const card = page.locator(".today-next .study-action-card");
    const href = await card.getAttribute("href");
    expect(href).toMatch(/^\/lessons\//);
    await card.click();
    await page.waitForURL(`**${href}`);
    await page.getByRole("button", { name: "Próximo", exact: true }).click();
    await expect(page.locator(".lesson-resume-controls")).toContainText("Ponto da aula salvo");
    await page.goto("/");
    await expect(card).toHaveAttribute("href", href!);
    await expect(card).toContainText("Continue de onde parou");
    await card.click();
    await expect(page.locator(".stepper-count")).toContainText("Passo 2 de");
  });

  test("keeps Today readable at phone width with the subject list", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Continuar estudando" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
