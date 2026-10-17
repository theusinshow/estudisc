import { expect, test } from "@playwright/test";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";

// Focus mode has no bottom navigation: the step controls must rest on the bottom edge, not float above it.
test("lesson step controls rest on the bottom edge in Focus mode", async ({ page, request }) => {
  test.skip(process.env.FEATURE_INTERACTIVE_LESSONS !== "true", "Focus mode needs interactive lessons.");
  const fixture = JSON.parse(JSON.stringify(source));
  fixture.track.modules[0].lessons.forEach((lesson: { status: string }) => lesson.status = "published");
  expect((await request.post("/api/import/track", { data: fixture })).ok()).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/lessons/${fixture.track.modules[0].lessons[0].id}`);
  await expect(page.locator(".app-shell")).toHaveAttribute("data-mode", "focus");
  await page.getByRole("button", { name: "Próximo" }).waitFor();
  await page.locator(".stepper-head").first().evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 300));
  const gap = await page.locator(".stepper-nav").evaluate(element => window.innerHeight - element.getBoundingClientRect().bottom);
  expect(gap).toBeLessThanOrEqual(24);
});
