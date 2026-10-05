import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test.beforeAll(() => {
  execFileSync(process.execPath, ["--import", "tsx", "tools/science-import/qa/render-mobile-preview.tsx"], { cwd: process.cwd(), env: process.env, stdio: "pipe" });
});

test("Science pilot static core SSR preserves mobile layout and native radio keyboard behavior", async ({ page }) => {
  // This preview is private, static SSR + existing app CSS. It does not publish or submit drafts.
  await page.setViewportSize({ width: 344, height: 800 });
  for (const id of ["CIE-04", "CIE-10", "CIE-18", "CIE-22", "CIE-30", "CIE-33", "CIE-38", "CIE-40"]) {
    await page.setContent(readFileSync(`.local/science-integration/qa-mobile/${id}.html`, "utf8"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Bloco inválido", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(40);
    const overflow = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
    expect(overflow.document, `${id}: horizontal overflow at 344px`).toBeLessThanOrEqual(overflow.viewport + 1);
    const first = page.getByRole("radio").first();
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press("Space");
    await expect(first).toBeChecked();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio").nth(1)).toBeChecked();
    for (const image of await page.getByRole("img").all()) expect(await image.getAttribute("alt")).toBeTruthy();
    const description = page.getByText("Descrição da imagem", { exact: true }).first();
    if (await description.count()) { await description.click(); await expect(description.locator("..")).toHaveAttribute("open", ""); }
  }
});
