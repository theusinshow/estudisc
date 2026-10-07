import { expect, test } from "@playwright/test";
import { enrichmentPreviewFixture } from "../fixtures/enrichment-preview";
import recipe from "../../tools/estudisc-content-studio/recipes/direct-proportion-linear.v1.json";

test("explores independent source-defined rates with keyboard/mobile and no official submission", async ({ page, request }, testInfo) => {
  test.setTimeout(90000);
  expect((await request.post("/api/import/track", { data: enrichmentPreviewFixture(recipe) })).ok()).toBe(true);
  const writes: string[] = [];
  page.on("request", r => { if (r.method() === "POST" && /\/api\/(lesson-resume|activities\/)/.test(r.url())) writes.push(r.url()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lessons/ENRICHMENT-PREVIEW-MAT-06-V3");
  await page.getByRole("button", { name: "Ver tudo", exact: true }).click();
  const notebooks = page.getByRole("region", { name: "Explore o preço dos cadernos", exact: true });
  const printer = page.getByRole("region", { name: "Explore a produção da copiadora", exact: true });
  const quantity = notebooks.getByRole("textbox", { name: "Quantidade de cadernos (cadernos)", exact: true });
  const time = printer.getByRole("textbox", { name: "Tempo de impressão (minutos)", exact: true });
  await expect(notebooks.getByRole("status")).toHaveText("Preço: 63 reais");
  await expect(printer.getByRole("status")).toHaveText("Páginas: 770 páginas");
  await quantity.fill("5"); await expect(notebooks.getByRole("status")).toHaveText("Preço: 35 reais");
  await expect(printer.getByRole("status")).toHaveText("Páginas: 770 páginas");
  await time.fill("2,5"); await expect(printer.getByRole("status")).toHaveText("Páginas: 175 páginas");
  await expect(notebooks.getByRole("status")).toHaveText("Preço: 35 reais");
  for (const invalid of ["", "21", "abc"]) {
    await quantity.fill(invalid); await expect(notebooks.getByRole("status")).toHaveText("Informe um valor entre 0 e 20.");
  }
  await quantity.fill("9"); await expect(notebooks.getByRole("status")).toHaveText("Preço: 63 reais");
  await expect(notebooks.getByRole("slider")).toHaveCount(process.env.FEATURE_INTERACTIVE_LESSONS === "true" ? 1 : 0);
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 }); await quantity.scrollIntoViewIfNeeded();
    await page.locator("main").click({ position: { x: 1, y: 1 } }); await quantity.focus();
    await expect(quantity).toBeFocused();
    const indicator = await quantity.evaluate(el => ({ shadow: getComputedStyle(el).boxShadow, width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(indicator.shadow).not.toBe("none"); expect(indicator.width).toBeLessThanOrEqual(indicator.viewport);
    expect((await quantity.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await notebooks.screenshot({ path: testInfo.outputPath(`linear-source-${width}.png`) });
  }
  const officialWrites = writes.filter(url => url.includes("/api/activities/")); expect(officialWrites).toEqual([]);
  if (process.env.FEATURE_INTERACTIVE_LESSONS !== "true") expect(writes).toEqual([]);
});
