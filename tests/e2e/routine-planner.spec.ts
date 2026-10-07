import { expect, test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";

test.describe("weekly routine rollout", () => {
  test.skip(process.env.FEATURE_STUDY_PLANNER !== "true" || process.env.FEATURE_NEW_TODAY !== "true", "Enable the Planner/Today flags for routine acceptance.");

  test("onboards days/time/priorities through an unsaved preview, saves and reloads the weekly plan", async ({ page, request }) => {
    const fixture = JSON.parse(JSON.stringify(source));
    fixture.questions.forEach((question: { status: string; exposurePolicy: { minimumDaysBetween: number } }) => { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; });
    fixture.track.modules.forEach((module: { lessons: { status: string }[] }) => module.lessons.forEach(lesson => { lesson.status = "published"; }));
    expect((await request.post("/api/import/track", { data: fixture })).ok()).toBeTruthy();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/plan");
    for (const day of ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]) await page.getByRole("checkbox", { name: day, exact: true }).check();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    for (const day of ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]) await page.getByLabel(`${day} · minutos`, { exact: true }).fill("60");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByRole("combobox", { name: "Modo", exact: true }).selectOption("ASSISTED");
    await page.getByRole("button", { name: "Gerar prévia", exact: true }).click();
    await expect(page.getByRole("button", { name: "Salvar rotina" })).toBeVisible();
    expect((await (await request.get("/api/study-plan")).json()).routine).toBeNull();
    await page.getByRole("button", { name: "Salvar rotina" }).click();
    await expect(page.getByRole("heading", { name: "Minha semana" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Minha semana" })).toBeVisible();
    const state = await (await request.get("/api/study-plan")).json();
    expect(state.routine.revision).toBe(1);
    if (state.week.activeSessionId) expect((await request.post("/api/study-sessions", { data: { action: "abandon", sessionId: state.week.activeSessionId } })).ok()).toBeTruthy();
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });

  test("previews a temporary day off, preserves the old plan until apply and exposes the truthful Today state", async ({ page, request }) => {
    const before = await (await request.get("/api/study-plan")).json();
    await page.goto("/plan");
    await page.getByRole("button", { name: "Editar rotina" }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByText("Ajustes de revisão, simulado e mudanças temporárias", { exact: true }).click();
    await page.getByLabel("Data da mudança", { exact: true }).fill(before.week.today);
    await page.getByLabel("Tempo nessa data (min)", { exact: true }).fill("0");
    await page.getByRole("button", { name: "Adicionar mudança", exact: true }).click();
    await page.getByRole("button", { name: "Gerar prévia", exact: true }).click();
    await expect(page.getByRole("button", { name: "Salvar rotina" })).toBeVisible();
    expect((await (await request.get("/api/study-plan")).json()).routine.revision).toBe(before.routine.revision);
    await page.getByRole("button", { name: "Salvar rotina" }).click();
    await expect(page.getByRole("heading", { name: "Minha semana" })).toBeVisible();
    await page.goto("/");
    await expect(page.getByText(/Hoje é dia livre na sua rotina/)).toBeVisible();
    const rejected = await request.post("/api/study-sessions", { data: { action: "plan", budgetMinutes: 15 } });
    expect(rejected.status()).toBe(409);
    expect(await rejected.json()).toMatchObject({ code: "routine_budget_exceeded" });
  });

  test("rejects concurrent old previews and keeps repeated apply idempotent", async ({ request }) => {
    const state = await (await request.get("/api/study-plan")).json();
    const input = { action: "preview", settings: state.routine.settings, baseRevision: state.routine.revision };
    const first = await (await request.post("/api/study-plan", { data: input })).json();
    const second = await (await request.post("/api/study-plan", { data: input })).json();
    expect((await request.post("/api/study-plan", { data: { action: "apply", previewId: first.id } })).ok()).toBeTruthy();
    expect((await request.post("/api/study-plan", { data: { action: "apply", previewId: first.id } })).ok()).toBeTruthy();
    const rejected = await request.post("/api/study-plan", { data: { action: "apply", previewId: second.id } });
    expect(rejected.status()).toBe(409);
    expect(await rejected.json()).toMatchObject({ code: "stale_preview" });
  });
});
