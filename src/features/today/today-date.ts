/** Align Hoje with the routine's already-evaluated calendar date; retain the legacy timezone without a routine. */
export function formatTodayDate(calendarDate?: string, now = new Date()) {
  const date = calendarDate ? new Date(`${calendarDate}T12:00:00Z`) : now;
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: calendarDate ? "UTC" : "America/Sao_Paulo" }).format(date);
}
