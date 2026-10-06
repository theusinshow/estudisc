type Level = "debug" | "info" | "warn" | "error";
const ranks: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const safeKeys = new Set(["operation", "status", "statusCode", "count", "durationMs", "errorType", "phase", "reasonCode", "legacyVariable", "canonicalVariable", "targetType", "version"]);
/** Deliberately allowlisted operational metadata; never serialize requests, errors, cookies or answers. */
export function logEvent(level: Level, event: string, metadata: Record<string, unknown> = {}) {
  const configured = process.env.LOG_LEVEL as Level | undefined;
  if (ranks[level] < ranks[configured && configured in ranks ? configured : "info"]) return;
  const fields = Object.fromEntries(Object.entries(metadata).filter(([key, value]) => safeKeys.has(key) && ["string", "number", "boolean"].includes(typeof value)));
  const record = JSON.stringify({ product: "Estudisc", time: new Date().toISOString(), level, event, ...fields });
  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.info(record);
}
