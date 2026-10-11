import { expect, test } from "@playwright/test";
import { loadBlueprintCorpus } from "../../tools/estudisc-content-studio/blueprint-sources";

test.use({ viewport: { width: 320, height: 900 }, launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

test("keeps authored Portuguese Question cards inside the lesson column with classic scrollbars", async ({ page, request }) => {
  // Disposable memory fixture only: no production publication/review records are asserted.
  const fixture = structuredClone(loadBlueprintCorpus(process.cwd()).find(c => c.pack.track.id === "ifsc-2027-portuguese")!.pack);
  const lessons = fixture.track.modules.flatMap(m => m.lessons).filter(l => ["POR-04", "POR-15", "POR-24"].includes(l.id));
  lessons.forEach(lesson => { lesson.status = "published"; });
  fixture.questions.forEach(question => { question.status = "published"; });
  expect((await request.post("/api/import/track", { data: fixture })).ok()).toBe(true);
  for (const lesson of lessons) {
    await page.goto(`/lessons/${lesson.id}`);
    await page.getByRole("button", { name: "Ver tudo", exact: true }).click();
    const question = page.locator(".learning-interaction").filter({ hasText: "Qual alternativa evita uma generalização inadequada" });
    await expect(question).toBeVisible();
    const answer = question.getByRole("radio").first();
    await answer.focus();
    await expect(answer).toBeFocused();
    for (const width of [320, 375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(() => page.evaluate(() => {
        const client = document.documentElement.clientWidth;
        return { scroll: document.documentElement.scrollWidth, client,
          overflows: [...document.querySelectorAll("main *")].filter(e => e.getBoundingClientRect().right > client + 1).slice(-3).map(e => ({ tag: e.tagName, className: e.className, right: e.getBoundingClientRect().right, text: e.textContent?.slice(0, 60) })) };
      })).toMatchObject({ scroll: await page.evaluate(() => document.documentElement.clientWidth) });
      const bounds = await question.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const parent = element.parentElement!.getBoundingClientRect();
        return { right: rect.right, parentRight: parent.right, contentClipped: element.scrollWidth > element.clientWidth,
          scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
          children: [...element.querySelectorAll("*")].filter(child => child.scrollWidth > child.clientWidth + 1).slice(0, 4).map(child => ({ tag: child.tagName, className: child.className, scroll: child.scrollWidth, client: child.clientWidth })) };
      });
      expect(bounds.right).toBeLessThanOrEqual(bounds.parentRight + 1);
      expect(bounds.contentClipped, JSON.stringify(bounds)).toBe(false);
      for (const label of await question.locator(".learning-answer").all()) {
        expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(56);
      }
    }
  }
});
