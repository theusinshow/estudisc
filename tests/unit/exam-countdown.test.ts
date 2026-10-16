import { expect, it } from "vitest";
import { daysUntilExam, examCountdownLabel } from "@/features/public-site/countdown";
import { accessLastDay } from "@/features/public-site/content-summary";

const endsAt = "2026-11-30T03:00:00.000Z"; // midnight after 29/11/2026 in Brasília

it("counts Brasília calendar days until the last access day, which is the exam day", () => {
  expect(accessLastDay(endsAt)).toBe("29/11/2026");
  expect(daysUntilExam(new Date("2026-10-16T15:00:00Z"), endsAt)).toBe(44);
  expect(daysUntilExam(new Date("2026-11-29T02:30:00Z"), endsAt)).toBe(1); // still 28/11 in Brasília
  expect(daysUntilExam(new Date("2026-11-29T12:00:00Z"), endsAt)).toBe(0);
  expect(daysUntilExam(new Date("2026-11-30T12:00:00Z"), endsAt)).toBeNull();
});

it("labels the countdown without inventing urgency", () => {
  expect(examCountdownLabel(44)).toBe("Faltam 44 dias para a prova");
  expect(examCountdownLabel(1)).toBe("Falta 1 dia para a prova");
  expect(examCountdownLabel(0)).toBe("A prova é hoje");
});
