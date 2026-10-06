import { expect, test } from "@playwright/test";

test("imports the bundled example Track Pack through the product surface", async ({ page }) => {
  await page.goto("/import");
  await page.getByText("Importação avançada (JSON ou aula gerada por IA)", { exact: true }).click();

  await expect(page.getByRole("heading", { name: "Ativar catálogo" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Estudar trilha pronta/i })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Aplicar" })).toBeDisabled();

  await page.getByRole("button", { name: "Carregar exemplo" }).click();
  await expect(page.getByRole("status", { name: "Estado da importação" })).toContainText(
    /Preview válido|Pack já importado/
  );
  await expect(page.getByRole("region", { name: "Preview" })).toContainText("JavaScript");

  const applyButton = page.getByRole("button", { name: "Aplicar" });
  if (await applyButton.isEnabled()) {
    await applyButton.click();
    await expect(page.getByRole("status", { name: "Estado da importação" })).toContainText(
      /Pack aplicado|Pack já estava importado/
    );
    await expect(page.getByRole("status", { name: /Catálogo ativado|Sem alteração/ })).toBeVisible();
  }

  await page.goto("/tracks");
  await expect(page.getByRole("link", { name: /JavaScript/ }).first()).toBeVisible();
});

test("keeps the first import step compact on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/import");
  await page.getByText("Importação avançada (JSON ou aula gerada por IA)", { exact: true }).click();

  await expect(page.getByRole("heading", { name: "Ativar catálogo" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Estudar trilha pronta/i })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Carregar exemplo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Manual / Copy Paste" })).toBeHidden();

  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    )
    .toBe(true);

  const sourceBox = await page.getByLabel("JSON do Track Pack").boundingBox();
  expect(sourceBox?.height).toBeLessThanOrEqual(230);

  const loadExampleBox = await page.getByRole("button", { name: "Carregar exemplo" }).boundingBox();
  const previewBox = await page.getByRole("button", { name: "Preview" }).boundingBox();
  expect(previewBox?.y).toBeGreaterThan((loadExampleBox?.y ?? 0) + (loadExampleBox?.height ?? 0));

  await page.getByRole("button", { name: /Criar aula com IA/ }).click();
  await expect(page.getByRole("tab", { name: "Manual / Copy Paste" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Carregar exemplo" })).toBeHidden();
});

test("validates and imports a manually generated Lesson Pack through the product surface", async ({ page }) => {
  await page.goto("/import");
  await page.getByText("Importação avançada (JSON ou aula gerada por IA)", { exact: true }).click();

  await page.getByRole("button", { name: /Criar aula com IA/ }).click();
  await expect(page.getByRole("tab", { name: "Manual / Copy Paste" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Compilar prompt" }).click();
  await expect(page.getByRole("status", { name: "Estado da geração" })).toContainText("Prompt compilado");
  await expect(page.getByLabel("Prompt compilado")).toContainText("caderno.lesson.v1");

  const generatedLesson = {
    schema: "caderno.lesson.v1",
    language: "pt-BR",
    lesson: {
      id: "generated-function-lesson",
      version: 1,
      title: "Funções em JavaScript",
      concepts: [
        {
          id: "js-function",
          title: "Função",
          summary: "Bloco reutilizável de lógica."
        }
      ],
      blocks: [
        {
          id: "generated-function-intro",
          type: "text",
          text: "Uma função organiza uma tarefa que pode ser chamada mais de uma vez."
        }
      ],
      activities: [
        {
          id: "generated-function-predict",
          type: "prediction",
          conceptIds: ["js-function"],
          prompt: "O que será exibido ao chamar uma função que retorna 2 + 2?"
        },
        {
          id: "generated-function-code",
          type: "code",
          conceptIds: ["js-function"],
          prompt: "Crie uma função soma que retorna a soma de dois números.",
          starterCode: "function soma(a, b) {\n  return 0;\n}",
          tests: []
        }
      ]
    }
  };

  await page.getByLabel("JSON gerado").fill(JSON.stringify(generatedLesson, null, 2));
  await page.getByRole("button", { name: "Validar" }).click();
  await expect(page.getByRole("status", { name: "Estado da geração" })).toContainText("JSON validado");
  await expect(page.getByRole("region", { name: "Preview da lição" })).toContainText("Funções em JavaScript");

  await page.getByRole("button", { name: "Importar lição" }).click();
  await expect(page.getByRole("status", { name: "Estado da geração" })).toContainText(
    /Lição gerada importada|Lição gerada já estava importada/
  );

  await page.goto("/lessons/generated-function-lesson");
  await expect(page.getByRole("heading", { name: "Funções em JavaScript" })).toBeVisible();
  await expect(page.getByText("Atividade de predição")).toBeVisible();
  await expect(page.getByText("Checagem de leitura. Nenhuma tentativa oficial é registrada nesta atividade.")).toBeVisible();
  await expect(page.getByText(/Atividade indispon/i)).toHaveCount(0);

  await page.goto("/tracks");
  await expect(page.getByRole("link", { name: /JavaScript gerado/ }).first()).toBeVisible();
});
