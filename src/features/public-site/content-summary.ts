import { PAID_ACCESS_ENDS_AT } from "@/features/payments/contracts";

/**
 * Published content shown on public and paywall pages. Update these numbers with each content release
 * (source: read-only production audit; see PROJECT_STATUS.md "Current content").
 */
export const CONTENT_SUMMARY = {
  lessons: 141,
  lessonQuestions: 1220,
  simulationTemplates: 3,
  simulationQuestions: 247,
  pastExams: 11,
  subjects: ["Matemática", "Ciências", "Língua Portuguesa", "Geografia e História"]
} as const;

export function formatCount(value: number) {
  return value.toLocaleString("pt-BR");
}

/** Last day of paid access in Brasília time (the grant ends at midnight after the exam day). */
export function accessLastDay(endsAt: string = PAID_ACCESS_ENDS_AT) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(Date.parse(endsAt) - 1));
}

/** Same day as `accessLastDay`, as an ISO date (YYYY-MM-DD) for structured data. */
export function accessLastDayIso(endsAt: string = PAID_ACCESS_ENDS_AT) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.parse(endsAt) - 1));
}
