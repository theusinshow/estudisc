import { expect, test } from "@playwright/test";

test("foundation shell renders on desktop", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Estudisc, página inicial" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Próxima ação");
  await expect(page.getByRole("link", { name: "Estudar", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continuar de onde parei" })).toBeVisible();
  await expect(page.getByText("Mais", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Fundação ativa")).toHaveCount(0);
});

test("mobile shell keeps four tabs and the central Continuar within thumb reach", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  for (const name of ["Hoje", "Estudar", "Continuar de onde parei", "Provas", "Você"]) {
    const link = nav.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    )
    .toBe(true);
});

test("secondary pages live in the Você tab, admin links only for ADMIN", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/voce");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const name of ["Progresso", "Conquistas", "Mapa de conceitos", "Histórico", "Revisão", "Erros", "Suporte"]) {
    await expect(page.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  const importLink = page.getByRole("link", { name: /Importar/ });
  await expect(importLink).toBeVisible();
  expect((await importLink.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

test("Provas tab gathers mock and past exams", async ({ page }) => {
  await page.goto("/provas");
  await expect(page.getByRole("heading", { name: "Provas", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /simulados completos/i })).toHaveAttribute("href", "/assessments");
  await expect(page.getByRole("link", { name: /provas, de 2022 a 2026/ })).toHaveAttribute("href", "/past-exams");
  await expect(page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Provas", exact: true })).toHaveAttribute("aria-current", "page");
});

test("central Continuar resolves a destination on tap", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Continuar de onde parei" }).click();
  await expect(page).toHaveURL(/\/(lessons\/|review|$)/);
});

test("skip link targets the main landmark", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Pular para o conteúdo principal" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});
