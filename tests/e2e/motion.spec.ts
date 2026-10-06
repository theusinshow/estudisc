import { expect, test } from "@playwright/test";

function cssTimeListToMs(value: string) {
  return value.split(",").map((part) => {
    const trimmed = part.trim();

    if (trimmed.endsWith("ms")) {
      return Number(trimmed.slice(0, -2));
    }

    if (trimmed.endsWith("s")) {
      return Number(trimmed.slice(0, -1)) * 1000;
    }

    return Number(trimmed);
  });
}

test("sign-in surface uses approved motion tokens for feedback and reveal", async ({ page }, testInfo) => {
  await page.goto("/auth/signin");

  const button = page.getByRole("button", { name: "Continuar com Google" });
  await expect(button).toBeVisible();

  const buttonMotion = await button.evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      transitionDuration: styles.transitionDuration,
      transitionProperty: styles.transitionProperty
    };
  });

  const panelAnimation = await page.locator(".auth-panel").evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return styles.animationDuration;
  });

  expect(buttonMotion.transitionProperty.split(",").map(property => property.trim())).toEqual(expect.arrayContaining(["background-color", "transform"]));
  expect(Math.max(...cssTimeListToMs(buttonMotion.transitionDuration))).toBeGreaterThanOrEqual(120);
  expect(Math.max(...cssTimeListToMs(buttonMotion.transitionDuration))).toBeLessThanOrEqual(180);
  expect(Math.max(...cssTimeListToMs(panelAnimation))).toBe(180);

  await button.hover();
  await page.screenshot({ path: testInfo.outputPath("motion-signin.png"), fullPage: true });
});

test("reduced motion keeps state visible without displacement choreography", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();

  await page.goto("/auth/signin");
  const button = page.getByRole("button", { name: "Continuar com Google" });
  await expect(button).toBeVisible();

  const reducedMotion = await button.evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      transform: styles.transform,
      transitionDuration: styles.transitionDuration
    };
  });

  const panelAnimation = await page.locator(".auth-panel").evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return styles.animationName;
  });

  expect(Math.max(...cssTimeListToMs(reducedMotion.transitionDuration))).toBeLessThanOrEqual(0.02);
  expect(reducedMotion.transform).toBe("none");
  expect(panelAnimation).toBe("none");

  await context.close();
});
