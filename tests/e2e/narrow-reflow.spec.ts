import { expect, test } from "@playwright/test";

// Headless Chromium hides scrollbars by default, which masks overflow caused by a classic (space-taking)
// vertical scrollbar on desktop Windows. Compare against clientWidth with real scrollbars instead.
test.use({ viewport: { width: 320, height: 720 }, launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

for (const path of ["/", "/tracks", "/progress", "/review", "/history", "/knowledge-map", "/auth/signin", "/auth/cadastro"]) {
  test(`reflows ${path} at 320 px without horizontal scrolling`, async ({ page }) => {
    await page.goto(path);
    await page.locator("main").first().waitFor();
    const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(scroll).toBeLessThanOrEqual(client);
  });
}
