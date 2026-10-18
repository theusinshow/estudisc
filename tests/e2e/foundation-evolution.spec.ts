import { expect, test } from "@playwright/test";

test.describe("flagged study foundation", () => {
  test.skip(process.env.FEATURE_NEW_TODAY !== "true" || process.env.FEATURE_INTERACTIVE_LESSONS !== "true", "Run this suite with the study foundation flags enabled.");

  test("keeps five touch destinations without horizontal scroll", async ({ page }) => {
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      const primary = page.getByRole("navigation", { name: "Navegação principal", exact: true });
      await expect(primary.getByRole("link")).toHaveCount(5);
      for (const link of await primary.getByRole("link").all()) {
        const bounds = await link.boundingBox();
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });

  test("redirects the retired planner to Hoje", async ({ page }) => {
    await page.goto("/plan");
    await expect(page).toHaveURL(/\/$/);
  });
});
