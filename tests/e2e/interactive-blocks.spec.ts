import { expect, test } from "@playwright/test";
import { interactivePack } from "../fixtures/interactive-blocks";

test("retains a static figure fallback when interactive presentation is disabled", async ({ page, request }) => {
  test.skip(process.env.FEATURE_INTERACTIVE_LESSONS === "true", "This case checks the off presentation.");
  expect((await request.post("/api/import/track", { data: interactivePack() })).ok()).toBe(true);
  await page.goto("/lessons/INTERACTIVE-PILOT");
  await page.getByRole("button", { name: "Ver tudo", exact: true }).click();
  await expect(page.locator(".lesson-figure")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Mostrar depois" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Explorar Local A" })).toHaveCount(0);
  await expect(page.locator(".lesson-resume-controls")).toHaveCount(0);
  await expect(page.getByText("Descrição do local B na fixture.", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("region", { name: "Explore o modelo linear" }).getByRole("slider")).toHaveCount(0);
});

test("explores and resumes typed blocks with keyboard/touch, image fallback and no submitted attempts", async ({ page, request }, testInfo) => {
  test.skip(process.env.FEATURE_INTERACTIVE_LESSONS !== "true", "Enable interactive lessons for acceptance.");
  test.setTimeout(60000);
  expect((await request.post("/api/import/track", { data: interactivePack() })).ok()).toBe(true);
  const submissions: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && request.url().includes("/api/activities/")) submissions.push(request.url()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lessons/INTERACTIVE-PILOT");
  await page.getByRole("textbox", { name: "Sua previsão", exact: true }).fill("O fundo muda");
  await page.getByRole("button", { name: "Observar", exact: true }).click();
  await page.getByRole("button", { name: "Conferir explicação", exact: true }).click();
  await page.getByRole("button", { name: "Ver tudo", exact: true }).click();
  const matching = page.getByRole("region", { name: "Relacione os locais" });
  await matching.getByRole("combobox", { name: "Primeiro local", exact: true }).selectOption("y");
  await matching.getByRole("combobox", { name: "Segundo local", exact: true }).selectOption("y");
  await matching.getByRole("button", { name: "Conferir resposta", exact: true }).click();
  for (const label of ["Dica", "Recordar o conceito", "Exemplo semelhante", "Passo a passo"]) await matching.getByRole("button", { name: `Estou travado · ${label}`, exact: true }).click();
  const timeline = page.getByRole("region", { name: "Ordene a sequência" });
  await timeline.getByRole("button", { name: "Mover Antes para cima", exact: true }).focus(); await page.keyboard.press("Enter");
  await timeline.getByRole("button", { name: "Conferir resposta", exact: true }).click();
  const percent = page.getByRole("region", { name: "Explore a porcentagem" });
  await percent.getByLabel("Valor base", { exact: true }).fill("300");
  await percent.getByRole("slider").focus(); await page.keyboard.press("ArrowRight");
  const linear = page.getByRole("region", { name: "Explore o modelo linear", exact: true });
  await linear.getByRole("slider").focus(); await page.keyboard.press("ArrowRight");
  await expect(linear.getByRole("status")).toContainText("Resultado: 10");
  const compared = page.locator(".visual-comparison");
  await compared.getByRole("button", { name: "Mostrar depois", exact: true }).click();
  expect(await compared.locator(".comparison-after").evaluate(element => getComputedStyle(element).clipPath)).not.toBe("none");
  const hot = page.getByRole("region", { name: "Explore os pontos" });
  await hot.getByRole("button", { name: "2. Local B", exact: true }).click();
  await hot.getByRole("slider").focus(); await page.keyboard.press("ArrowRight");
  const map = page.getByRole("region", { name: "Explore o diagrama de locais" });
  await map.getByRole("button", { name: "1. Local A", exact: true }).click();
  await page.getByRole("button", { name: "Salvar ponto da aula", exact: true }).click();
  await expect(page.locator(".lesson-resume-controls")).toContainText("Ponto da aula salvo");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Sua previsão", exact: true })).toHaveValue("O fundo muda");
  await expect(matching.getByRole("combobox", { name: "Primeiro local", exact: true })).toHaveValue("y");
  await expect(matching).toContainText("Passo a passo");
  await expect(matching).toContainText("Parte do raciocínio está no caminho");
  await expect(timeline).toContainText("Resposta correta");
  await expect(percent.getByLabel("Valor base", { exact: true })).toHaveValue("300");
  await expect(linear.getByRole("slider")).toHaveValue("3");
  await expect(compared.getByRole("slider")).toHaveValue("100");
  await expect(hot.getByRole("status")).toContainText("Descrição do local B");
  await expect(hot.getByRole("slider")).toHaveValue("1.25");
  await expect(map.getByRole("status")).toContainText("Descrição do local A");
  await expect(hot.locator(".location-marker")).toHaveCount(2);
  const geometry = await hot.evaluate(root => {
    const frame = root.querySelector(".location-frame")!.getBoundingClientRect(), marker = root.querySelector(".location-marker")!.getBoundingClientRect();
    return { centerX: marker.left + marker.width / 2 - frame.left, centerY: marker.top + marker.height / 2 - frame.top, frameWidth: frame.width, frameHeight: frame.height, viewportWidth: root.querySelector(".location-viewport")!.clientWidth };
  });
  expect(geometry.centerX).toBeCloseTo(geometry.frameWidth * 0.1, 0);
  expect(geometry.centerY).toBeCloseTo(geometry.frameHeight * 0.5, 0);
  expect(Math.abs(geometry.frameWidth - geometry.viewportWidth * 1.25)).toBeLessThan(2);
  expect(submissions).toEqual([]);
  for (const width of [320, 360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await compared.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`interactive-${width}.png`), caret: "initial" });
    if (width === 320 || width === 1280) {
      await hot.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath(`hotspot-${width}.png`), caret: "initial" });
      await linear.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath(`linear-${width}.png`), caret: "initial" });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    for (const marker of await hot.locator(".location-marker").all()) {
      const box = await marker.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  }
  await hot.getByRole("img").evaluate(element => element.dispatchEvent(new Event("error")));
  await expect(hot.getByRole("button", { name: "Tentar carregar imagem", exact: true })).toBeVisible();
  await hot.getByRole("button", { name: "1. Local A", exact: true }).click();
  await expect(hot.getByRole("status")).toContainText("Descrição do local A");
  expect(submissions).toEqual([]);
});
