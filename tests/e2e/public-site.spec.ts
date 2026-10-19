import { expect, test } from "@playwright/test";

const pages = [
  { path: "/conheca", heading: /prova do IFSC/ },
  { path: "/termos", heading: "Termos de uso" },
  { path: "/privacidade", heading: "Política de privacidade" },
  { path: "/suporte", heading: "Como podemos ajudar?" },
  { path: "/pais-e-escolas", heading: /plano para a prova do IFSC/ }
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
  await expect(page.getByText("R$ 39,90", { exact: true })).toBeVisible();
  await expect(page.getByText(/até 29\/11\/2026/)).toBeVisible();
  await page.getByRole("navigation", { name: "Informações legais" }).getByRole("link", { name: "Termos de uso" }).click();
  await expect(page).toHaveURL(/\/termos$/);
  await expect(page.getByText(/serão publicados aqui antes do início das vendas/)).toBeVisible();
});

test("support explains a question report, FAQ answers open, and crawler files list only public pages", async ({ page, request }) => {
  await page.goto("/suporte?erro=MAT-01-Q01%20v2");
  await expect(page.getByRole("heading", { name: "Avisar um erro na questão" })).toBeVisible();
  await expect(page.getByText("MAT-01-Q01 v2")).toBeVisible();
  await page.getByText("Posso desistir da compra?").click();
  await expect(page.getByText(/Em até 7 dias corridos/)).toBeVisible();
  await page.goto("/suporte?erro=%3Cscript%3E");
  await expect(page.getByRole("heading", { name: "Avisar um erro na questão" })).toHaveCount(0);

  const robots = await (await request.get("/robots.txt")).text();
  // Crawl everything but the API and admin; indexing is decided by noindex metadata (docs/30-SEO.md).
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Disallow: /api/");
  expect(robots).toContain("Disallow: /admin");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of ["/conheca", "/termos", "/privacidade", "/suporte", "/pais-e-escolas"]) expect(sitemap).toContain(path);
  // Without APP_URL, absolute links follow the host that served the request, never a hard-coded localhost.
  const origin = new URL(page.url()).origin;
  expect(sitemap).toContain(`<loc>${origin}/conheca</loc>`);
  const image = await request.get("/opengraph-image");
  expect(image.headers()["content-type"]).toContain("image/png");

  const missing = await page.goto("/pagina-que-nao-existe");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Esta página não existe" })).toBeVisible();
});
