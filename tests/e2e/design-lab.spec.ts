import { expect, test } from "@playwright/test";

test("admin compares themes in the design lab and previews the whole app", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto("/admin/lab");
  await expect(page.getByRole("heading", { name: "Lab de design" })).toBeVisible();
  await expect(page.locator(".dc[data-theme=\"vibrante\"]")).toBeVisible();
  await expect(page.locator(".lab-report").getByText("Falha")).toHaveCount(0);
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }

  await page.getByRole("button", { name: "Ver o app inteiro neste tema" }).click();
  await expect(page.getByRole("status").filter({ hasText: "App inteiro: Vibrante" })).toBeVisible();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "vibrante");

  await page.goto("/admin/lab");
  await page.getByRole("button", { name: "Voltar ao tema atual" }).click();
  await expect(page.getByRole("status").filter({ hasText: "App inteiro: tema atual" })).toBeVisible();
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "vibrante");
});
