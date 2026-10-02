import { readFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const passingSource =
  "const documentExists = true;\nconst userAuthorized = false;\nconst canOpen = documentExists && userAuthorized;\nconsole.log(canOpen);";
const debugPassingSource = 'const base = "5";\nconst bonus = 2;\nconst total = Number(base) + bonus;\nconsole.log(total);';

test("mobile lesson page exposes the study flow and compact practice controls", async ({ page, request }) => {
  const packPath = path.join(process.cwd(), "packs", "examples", "javascript-fundamentals.track.json");
  const pack = JSON.parse(await readFile(packPath, "utf8"));
  const importResponse = await request.post("/api/import/track", { data: pack });

  expect([200, 201]).toContain(importResponse.status());

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/lessons/js-fundamentals-001");

  const lessonFlow = page.getByRole("navigation", { name: "Fluxo da aula" });
  await expect(page.getByLabel("Estado da sessão de estudo")).toContainText(
    /Leia a teoria|Continue pela prática|Todas as atividades desta aula foram aprovadas/
  );
  await expect(lessonFlow.getByRole("link", { name: /Aula/ })).toBeVisible();
  await expect(lessonFlow.getByRole("link", { name: /Conceitos/ })).toBeVisible();
  await lessonFlow.getByRole("link", { name: /Prática/ }).click();

  await expect(page.getByRole("heading", { name: "Prática" })).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    )
    .toBe(true);

  const codePanel = page.getByRole("region", { name: /Crie uma condição/ });
  const sourceBox = await codePanel.getByLabel("Código").boundingBox();
  expect(sourceBox?.height).toBeLessThanOrEqual(230);

  const runBox = await codePanel.getByRole("button", { name: "RUN" }).boundingBox();
  const submitBox = await codePanel.getByRole("button", { name: "SUBMIT SOLUTION" }).boundingBox();
  expect(submitBox?.y).toBeGreaterThan((runBox?.y ?? 0) + (runBox?.height ?? 0));
});

test("mobile catalog and progress keep a visible continuation path", async ({ page, request }) => {
  const packPath = path.join(process.cwd(), "packs", "examples", "javascript-fundamentals.track.json");
  const pack = JSON.parse(await readFile(packPath, "utf8"));
  const importResponse = await request.post("/api/import/track", { data: pack });

  expect([200, 201]).toContain(importResponse.status());

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/tracks/javascript");

  const continueLesson = page.getByRole("link", { name: /Começar pela primeira aula|Continuar pela próxima aula/ });
  await expect(continueLesson).toBeVisible();
  await expect(continueLesson).toContainText("Variáveis, tipos e operadores");
  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    )
    .toBe(true);

  await page.goto("/progress");
  const continueStudying = page.getByRole("link", { name: /Continuar estudando/ });
  await expect(continueStudying).toBeVisible();
  await continueStudying.click();
  await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible();
});

test("imports a Track Pack, browses the lesson, runs code, submits and shows history", async ({ page, request }) => {
  const packPath = path.join(process.cwd(), "packs", "examples", "javascript-fundamentals.track.json");
  const pack = JSON.parse(await readFile(packPath, "utf8"));
  const importResponse = await request.post("/api/import/track", { data: pack });

  expect([200, 201]).toContain(importResponse.status());

  await page.goto("/tracks");
  await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible();
  await expect(page.getByRole("link", { name: /JavaScript/ }).first()).toBeVisible();
  await page.goto("/tracks/javascript");

  await expect(page.getByRole("heading", { name: "JavaScript" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Variáveis, tipos e operadores/ })).toBeVisible();
  await page.goto("/lessons/js-fundamentals-001");

  await expect(page.getByRole("heading", { name: "Variáveis, tipos e operadores" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Logical AND/ })).toBeVisible();
  await page.goto("/concepts/js-logical-and");
  await expect(page.getByRole("heading", { name: "Logical AND" })).toBeVisible();
  await expect(page.getByLabel("Mastery do conceito")).toContainText("POLICY mastery.v1");
  await expect(page.getByLabel("Mastery do conceito")).toContainText(/Não visto|Entendido|Praticando/);
  await page.getByRole("link", { name: /^Variáveis, tipos e operadores/ }).click();

  await expect(page.getByRole("heading", { name: "Variáveis, tipos e operadores" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Crie uma condição/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Corrija o bug/ })).toBeVisible();

  const codePanel = page.getByRole("region", { name: /Crie uma condição/ });
  await codePanel.getByLabel("Código").fill(passingSource);
  await codePanel.getByRole("button", { name: "RUN" }).click();
  await expect(page.getByText("RUN concluído sem registrar tentativa")).toBeVisible();
  await expect(codePanel.getByLabel("Saída da execução")).toContainText("false");

  await codePanel.getByRole("button", { name: "SUBMIT SOLUTION" }).click();
  await expect(page.getByText(/SUBMIT registrou tentativa/)).toBeVisible();
  await expect(codePanel.getByLabel("Última tentativa")).toContainText(/Tentativa \d+: passed/);
  await expect(codePanel.getByLabel("Resultados dos testes")).toContainText("uses both conditions");
  await expect(codePanel.getByLabel("Resultados dos testes")).toContainText("passed");
  await expect(codePanel.getByLabel("Diff da tentativa")).toContainText("documentExists && userAuthorized");

  const debugPanel = page.getByRole("region", { name: /Corrija o bug/ });
  await expect(debugPanel).toContainText("Atividade de debug");
  await debugPanel.getByLabel("Código").fill(debugPassingSource);
  await debugPanel.getByRole("button", { name: "SUBMIT SOLUTION" }).click();
  await expect(debugPanel.getByLabel("Última tentativa")).toContainText(/Tentativa \d+: passed/);
  await expect(debugPanel.getByLabel("Resultados dos testes")).toContainText("prints numeric sum");
  await expect(debugPanel.getByLabel("Diff da tentativa")).toContainText("Number(base) + bonus");

  await page.reload();
  const reloadedCodePanel = page.getByRole("region", { name: /Crie uma condição/ });
  const reloadedDebugPanel = page.getByRole("region", { name: /Corrija o bug/ });
  await expect(reloadedCodePanel.getByLabel("Última tentativa")).toContainText(/Tentativa \d+: passed/);
  await expect
    .poll(async () =>
      reloadedCodePanel.locator("details.activity-technical-details").evaluate((details) => details.hasAttribute("open"))
    )
    .toBe(false);
  await reloadedCodePanel.getByText("Terminal, testes e diff").click();
  await expect(reloadedCodePanel.getByLabel("Saída da execução")).toContainText("false");
  await expect(reloadedCodePanel.getByLabel("Diff da tentativa")).toContainText("documentExists && userAuthorized");
  await expect(reloadedDebugPanel.getByLabel("Última tentativa")).toContainText(/Tentativa \d+: passed/);
  await reloadedDebugPanel.getByText("Terminal, testes e diff").click();
  await expect(page.getByLabel("Progresso")).toContainText("Atividades aprovadas");
  await expect(page.getByLabel("Progresso")).toContainText("2/2");
  // Passing every activity in one sitting is evidence, not mastery: the policy label must stay below "Dominado".
  await expect(page.getByLabel("Progresso")).toContainText("Domínio dos conceitos");
  await expect(page.getByLabel("Progresso")).not.toContainText("Dominado");
  await expect(page.getByLabel("Estado da sessão de estudo")).toContainText("Todas as atividades desta aula foram aprovadas");

  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await expect(page.getByLabel("Estado da sessão de estudo")).toContainText("Todas as atividades desta aula foram aprovadas");
  await expect
    .poll(async () =>
      page
        .getByRole("region", { name: /Crie uma condição/ })
        .locator("details.activity-technical-details")
        .evaluate((details) => details.hasAttribute("open"))
    )
    .toBe(false);

  await page.goto("/concepts/js-logical-and");
  await expect(page.getByLabel("Mastery do conceito")).toContainText("POLICY mastery.v1");
  await expect(page.getByLabel("Mastery do conceito")).toContainText(/Entendido|Praticando/);
  await expect(page.getByLabel("Mastery do conceito")).toContainText(/[23]\/5/);
  await expect(page.getByLabel("Mastery do conceito")).toContainText("evidência registrada");

  await page.goto("/tracks/javascript");
  await expect(page.getByLabel("Progresso")).toContainText("Aulas concluídas");
  await expect(page.getByLabel("Progresso")).toContainText("1/1");

  await page.getByText("Mais", { exact: true }).click();
  await page.getByRole("link", { name: "Histórico" }).click();
  await expect(page.getByRole("heading", { name: "Eventos" })).toBeVisible();
  await expect(page.getByLabel("Eventos de estudo")).toContainText("activity_submitted");
  await expect(page.getByLabel("Eventos de estudo")).toContainText("js-logical-and-code-001");
});
