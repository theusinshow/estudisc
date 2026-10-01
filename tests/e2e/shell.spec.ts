import { expect, test } from "@playwright/test";

test("foundation shell renders on desktop", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "KNOW/OS página inicial" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Próxima ação");
  await expect(page.getByRole("link", { name: /Aprender/ })).toBeVisible();
  await expect(page.getByText("Mais", { exact: true })).toBeVisible();
  await expect(page.getByText("Fundação ativa")).toHaveCount(0);
});

test("mobile shell keeps primary study navigation visible", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: /Hoje/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Aprender/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Progresso/ })).toBeVisible();
  await expect(page.getByText("Mais", { exact: true })).toBeVisible();

  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    )
    .toBe(true);
});

test("mobile secondary navigation stays collapsed until requested", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/import");

  await expect(page.getByRole("heading", { name: "Ativar catálogo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Importar" })).toBeHidden();

  await page.getByText("Mais", { exact: true }).click();
  const importLink = page.getByRole("link", { name: "Importar" });
  await expect(importLink).toBeVisible();

  const importBox = await importLink.boundingBox();
  expect(importBox?.height).toBeGreaterThanOrEqual(44);
});

test("skip link targets the main landmark", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Pular para o conteúdo principal" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});
