import { PAID_ACCESS_ENDS_AT } from "@/features/payments/contracts";

const brasiliaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });
const dayNumber = (date: Date) => Date.parse(`${brasiliaDay.format(date)}T00:00:00Z`) / 86_400_000;

/**
 * Whole calendar days (Brasília) from today until the exam day, which is the last day of paid access.
 * 0 on the exam day; null after it, so no countdown is shown once the date has passed.
 */
export function daysUntilExam(now: Date = new Date(), endsAt: string = PAID_ACCESS_ENDS_AT) {
  const days = dayNumber(new Date(Date.parse(endsAt) - 1)) - dayNumber(now);
  return days >= 0 ? days : null;
}

export function examCountdownLabel(days: number) {
  return days === 0 ? "A prova é hoje" : days === 1 ? "Falta 1 dia para a prova" : `Faltam ${days} dias para a prova`;
}
