import { expect, it } from "vitest";
import { formatTodayDate } from "@/features/today/today-date";

it("uses the evaluated routine day at a timezone boundary and preserves the old date without a routine", () => {
  const now = new Date("2026-10-07T01:00:00Z");
  expect(formatTodayDate("2026-10-07", now)).toContain("7 de outubro");
  expect(formatTodayDate(undefined, now)).toContain("6 de outubro");
});
