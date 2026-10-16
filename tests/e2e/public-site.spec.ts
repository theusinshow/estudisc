import { expect, test } from "@playwright/test";

const pages = [
  { path: "/conheca", heading: /prova do IFSC/ },
  { path: "/termos", heading: "Termos de uso" },
  { path: "/privacidade", heading: "Política de privacidade" }
];

test("public sales and legal pages render with landmarks and fit a 320 px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const entry of pages) {
    await page.goto(entry.path);
    await expect(page.getByRole("heading", { level: 1, name: entry.heading })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Informações legais" })).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, entry.path).toBeLessThanOrEqual(0);
  }
  await page.goto("/conheca");
  await expect(page.getByText("R$ 50")).toBeVisible();
  await expect(page.getByText(/até 29\/11\/2026/)).toBeVisible();
  await page.getByRole("navigation", { name: "Informações legais" }).getByRole("link", { name: "Termos de uso" }).click();
  await expect(page).toHaveURL(/\/termos$/);
  await expect(page.getByText(/serão publicados aqui antes do início das vendas/)).toBeVisible();
});
