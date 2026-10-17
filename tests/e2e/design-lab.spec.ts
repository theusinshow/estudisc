import { expect, test } from "@playwright/test";

test("vibrante is the default theme and the design catalog stays within the phone width", async ({ page }) => {
  test.setTimeout(90000);
  for (const path of ["/", "/provas", "/auth/signin"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "vibrante");
  }
  await page.goto("/admin/lab");
  await expect(page.getByRole("heading", { name: "Lab de design" })).toBeVisible();
  await expect(page.locator(".lab-report").getByText("Falha")).toHaveCount(0);
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});
