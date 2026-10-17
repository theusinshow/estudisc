// Per-IP cap on sending sign-in codes, in memory per instance (as ADR 0031); the per-e-mail cap is in the database.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const sends = new Map<string, number[]>();

export function allowCodeSend(ip: string, now = Date.now()) {
  const recent = (sends.get(ip) ?? []).filter(at => at > now - WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) { sends.set(ip, recent); return false; }
  recent.push(now); sends.set(ip, recent);
  return true;
}

export function requestIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}
