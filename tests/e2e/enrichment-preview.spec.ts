import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { enrichmentPreviewFixture } from "../fixtures/enrichment-preview";

test("reviews the source percentage preview with touch/keyboard and no official submission", async ({ page, request }, testInfo) => {
  test.setTimeout(90000);
  expect((await request.post("/api/import/track", { data: enrichmentPreviewFixture() })).ok()).toBe(true);
  const submitted: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && request.url().includes("/api/activities/")) submitted.push(request.url()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lessons/ENRICHMENT-PREVIEW-MAT-07-V5");
  await page.getByRole("button", { name: "Ver tudo", exact: true }).click();
  const region = page.getByRole("region", { name: "Explore a porcentagem", exact: true });
  await expect(region.getByRole("status")).toHaveText("16% de 275 = 44");
  await region.getByRole("textbox", { name: "Valor base", exact: true }).fill("300");
  await region.getByRole("textbox", { name: "Porcentagem", exact: true }).fill("20");
  await expect(region.getByRole("status")).toHaveText("20% de 300 = 60");
  const enabled = process.env.FEATURE_INTERACTIVE_LESSONS === "true";
  await expect(region.getByRole("slider")).toHaveCount(enabled ? 1 : 0);
  if (enabled) {
    await region.getByRole("slider").focus(); await page.keyboard.press("ArrowRight");
    await expect(region.getByRole("status")).toHaveText("20,1% de 300 = 60,3");
  }
  await region.getByRole("textbox", { name: "Porcentagem", exact: true }).fill("501");
  await expect(region.getByRole("status")).toContainText("entre 0 e 500");
  await region.getByRole("textbox", { name: "Valor base", exact: true }).fill("275");
  await region.getByRole("textbox", { name: "Porcentagem", exact: true }).fill("16");
  const directory = join(process.cwd(), ".local/enrichment-preview", enabled ? "on" : "off");
  mkdirSync(directory, { recursive: true });
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await region.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const input = region.getByRole("textbox", { name: "Valor base", exact: true });
    await page.mouse.move(0, 0);
    await region.getByRole("textbox", { name: "Porcentagem", exact: true }).focus();
    await expect(region.getByRole("textbox", { name: "Porcentagem", exact: true })).toBeFocused();
    const indicator = () => input.evaluate(element => {
      const style = getComputedStyle(element);
      return { shadow: style.boxShadow, background: style.backgroundColor, outline: style.outlineStyle };
    });
    await expect.poll(indicator).toMatchObject({ shadow: "none" });
    const before = await indicator();
    await page.keyboard.press("Shift+Tab");
    await expect(input).toBeFocused();
    await expect.poll(indicator).not.toEqual(before);
    await expect.poll(async () => (await indicator()).shadow).not.toBe("none");
    expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.evaluate(() => window.scrollBy(0, -160));
    await region.screenshot({ path: join(directory, `${testInfo.project.name}-${width}.png`) });
  }
  expect(submitted).toEqual([]);
});
