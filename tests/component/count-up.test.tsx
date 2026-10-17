import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { CountUp } from "@/components/motion/count-up";

it("shows a number once: the screen-reader copy uses a class the global CSS actually hides", () => {
  const { container } = render(<CountUp value={21} />);
  const hidden = container.querySelector(".count-up > span:not([aria-hidden])");
  expect(hidden?.className).toBe("visually-hidden");
  expect(readFileSync("src/styles/application/assessments.css", "utf8")).toMatch(/\.visually-hidden\s*\{[^}]*position:\s*absolute/);
  expect(readFileSync("src/app/globals.css", "utf8")).toContain("application/assessments.css");
});
