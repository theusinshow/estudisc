// Slows down guessing of the 6-digit codes. In-memory, so it is per server instance: on serverless
// hosting it raises the cost of guessing but is not a global limit (documented in ADR 0031).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; firstAt: number }>();

export function loginRetryAfterSeconds(key: string, now = Date.now()): number {
  const entry = failures.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) return 0;
  return entry.count >= MAX_FAILURES ? Math.ceil((entry.firstAt + WINDOW_MS - now) / 1000) : 0;
}

export function recordLoginFailure(key: string, now = Date.now()) {
  const entry = failures.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) failures.set(key, { count: 1, firstAt: now });
  else entry.count += 1;
  if (failures.size > 10_000) failures.clear();
}

export function clearLoginFailures(key: string) {
  failures.delete(key);
}
