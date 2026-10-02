// A learner writes "75%", "4 copos" or "R$ 10,90" for a numeric answer. The number is graded;
// a trailing % or unit word is only a label (never converted), and a suffix may not hide digits.
const NUMERIC_RESPONSE = /^(?:R\$\s*)?([-+]?\d+(?:[.,]\d+)?)\s*(?:%|°|\p{L}[\p{L}\p{No}\s./]*)?$/u;

export function parseNumericResponse(response: unknown): number {
  if (typeof response === "number") return response;
  if (typeof response !== "string") return NaN;
  const match = NUMERIC_RESPONSE.exec(response.trim());
  return match?.[1] ? Number(match[1].replace(",", ".")) : NaN;
}
