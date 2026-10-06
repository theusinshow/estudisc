import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { OUTPUT, PILOT, runtimeId } from "../../tools/gh-import/mapper";
import { hashCanonicalJson } from "../../src/lib/canonical-json";

test.beforeAll(() => {
  execFileSync(process.execPath, ["--import", "tsx", "tools/science-import/qa/render-mobile-preview.tsx"], { cwd: process.cwd(), env: { ...process.env, EDITORIAL_QA_PACK: `${OUTPUT}/pilot/gh.pack.json`, EDITORIAL_QA_PILOTS: PILOT.map(runtimeId).join(","), EDITORIAL_QA_OUTPUT: `${OUTPUT}/qa-mobile` }, stdio: "pipe" });
});
test("GH pilots preserve mobile text layout and native keyboard choices", async ({ page }) => {
  await page.setViewportSize({ width: 344, height: 800 });
  for (const id of PILOT.map(runtimeId)) {
    await page.setContent(readFileSync(`${OUTPUT}/qa-mobile/${id}.html`, "utf8"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Bloco inválido", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(40);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), id).toBe(true);
    const first = page.getByRole("radio").first(); await first.focus(); await expect(first).toBeFocused();
    await page.keyboard.press("Space"); await expect(first).toBeChecked();
    await page.keyboard.press("ArrowDown"); await expect(page.getByRole("radio").nth(1)).toBeChecked();
    await page.screenshot({ path: `${OUTPUT}/qa-mobile/${id}.png` });
  }
  const pack = JSON.parse(readFileSync(`${OUTPUT}/pilot/gh.pack.json`, "utf8"));
  const core = JSON.parse(readFileSync(`${OUTPUT}/pilot-core-qa.json`, "utf8"));
  expect(core).toEqual({ passed: true, contentHash: hashCanonicalJson(pack) });
  writeFileSync(`${OUTPUT}/pilot-qa.json`, JSON.stringify({ passed: true, contentHash: core.contentHash, scope: "static core SSR/mobile keyboard; no hydrated study or publication" }));
});
