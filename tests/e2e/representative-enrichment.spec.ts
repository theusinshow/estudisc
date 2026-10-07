import { expect, test } from "@playwright/test";
import { enrichmentPreviewFixture } from "../fixtures/enrichment-preview";
import count from "../../tools/estudisc-content-studio/recipes/multiplicative-count.v1.json";
import price from "../../tools/estudisc-content-studio/recipes/algebraic-price.v1.json";

test("uses whole counts in distinct source examples with no official submission", async ({ page, request }, testInfo) => {
  const writes: string[] = [];
  page.on("request", r => { if (r.method() === "POST" && r.url().includes("/api/activities/")) writes.push(r.url()); });
  for (const recipe of [price, count]) {
    expect((await request.post("/api/import/track", { data: enrichmentPreviewFixture(recipe) })).ok()).toBe(true);
    await page.goto(`/lessons/ENRICHMENT-PREVIEW-${recipe.identity.lessonId}-V${recipe.newVersion}`);
    await page.getByRole("button", { name: "Ver tudo", exact: true }).click();
    const region = page.getByRole("region", { name: recipe.additions[0].parameters.title, exact: true });
    const input = region.getByRole("textbox", { name: recipe.additions[0].parameters.variableLabel, exact: true });
    await input.fill("3,5"); await expect(region.getByRole("status")).toContainText("Informe um número inteiro");
    if (recipe === price) for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 }); await region.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await region.screenshot({ path: testInfo.outputPath(`integer-feedback-${width}.png`) });
    }
    await input.fill("4"); await expect(region.getByRole("status")).toHaveText(recipe === price ? "Preço total: 37 reais" : "Combinações: 8");
    await input.fill("3"); await expect(region.getByRole("status")).toHaveText(recipe === price ? "Preço total: 29 reais" : "Combinações: 6");
    await input.focus(); await expect(input).toBeFocused(); expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect(writes).toEqual([]);
});
