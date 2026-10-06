import { logEvent } from "./logger.ts";
import { z } from "zod";
import { featureFlagsSchema } from "./feature-flags.ts";

const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.url().optional());
const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional()
);
const optionalUrlWithDefault = (defaultValue: string) =>
  z.preprocess((value) => (value === "" ? undefined : value), z.url().default(defaultValue));
const optionalBooleanString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["true", "false"]).transform(value => value === "true").optional()
);
const deepSeekModel = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["deepseek-v4-flash", "deepseek-v4-pro"]).optional()
);
const emailAllowlist = z.preprocess((value) => {
  if (value === "" || value === undefined) {
    return [];
  }

  if (typeof value !== "string") {
    return value;
  }

  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}, z.array(z.email()).default([]));

export const serverEnvSchema = z.object({
  APP_URL: optionalUrl,
  AUTH_GOOGLE_ID: optionalSecret,
  AUTH_GOOGLE_SECRET: optionalSecret,
  AUTH_SECRET: optionalSecret,
  AUTH_TRUST_HOST: optionalBooleanString,
  DATABASE_URL: optionalUrl,
  DEEPSEEK_API_KEY: optionalSecret,
  DEEPSEEK_BASE_URL: optionalUrlWithDefault("https://api.deepseek.com"),
  DEEPSEEK_DEFAULT_MODEL: deepSeekModel.default("deepseek-v4-flash"),
  DEEPSEEK_PRO_MODEL: deepSeekModel.default("deepseek-v4-pro"),
  ESTUDISC_ALLOWED_GOOGLE_EMAILS: emailAllowlist,
  ESTUDISC_ADMIN_GOOGLE_EMAILS: emailAllowlist,
  ESTUDISC_OWNER_ID: z.string().trim().min(1).default("local-owner"),
  ESTUDISC_ACCOUNTS: optionalSecret,
  ESTUDISC_RUN_REAL_POSTGRES_TESTS: z.enum(["0", "1"]).optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ...featureFlagsSchema.shape
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const warnedLegacyVariables = new Set<string>();

export function getServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  for (const suffix of ["ALLOWED_GOOGLE_EMAILS", "ADMIN_GOOGLE_EMAILS", "OWNER_ID", "ACCOUNTS", "RUN_REAL_POSTGRES_TESTS"]) {
    const legacy = `KNOW_OS_${suffix}`, canonical = `ESTUDISC_${suffix}`;
    if (source[canonical] === undefined && source[legacy] !== undefined && !warnedLegacyVariables.has(legacy)) {
      warnedLegacyVariables.add(legacy);
      logEvent("warn", "deprecated_environment_alias", { legacyVariable: legacy, canonicalVariable: canonical });
    }
  }
  return serverEnvSchema.parse({
    APP_URL: source.APP_URL,
    AUTH_GOOGLE_ID: source.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: source.AUTH_GOOGLE_SECRET,
    AUTH_SECRET: source.AUTH_SECRET,
    AUTH_TRUST_HOST: source.AUTH_TRUST_HOST,
    DATABASE_URL: source.DATABASE_URL,
    DEEPSEEK_API_KEY: source.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: source.DEEPSEEK_BASE_URL,
    DEEPSEEK_DEFAULT_MODEL: source.DEEPSEEK_DEFAULT_MODEL,
    DEEPSEEK_PRO_MODEL: source.DEEPSEEK_PRO_MODEL,
    ESTUDISC_ALLOWED_GOOGLE_EMAILS: source.ESTUDISC_ALLOWED_GOOGLE_EMAILS ?? source.KNOW_OS_ALLOWED_GOOGLE_EMAILS,
    ESTUDISC_ADMIN_GOOGLE_EMAILS: source.ESTUDISC_ADMIN_GOOGLE_EMAILS ?? source.KNOW_OS_ADMIN_GOOGLE_EMAILS,
    ESTUDISC_OWNER_ID: source.ESTUDISC_OWNER_ID ?? source.KNOW_OS_OWNER_ID,
    ESTUDISC_ACCOUNTS: source.ESTUDISC_ACCOUNTS ?? source.KNOW_OS_ACCOUNTS,
    ESTUDISC_RUN_REAL_POSTGRES_TESTS: source.ESTUDISC_RUN_REAL_POSTGRES_TESTS ?? source.KNOW_OS_RUN_REAL_POSTGRES_TESTS,
    LOG_LEVEL: source.LOG_LEVEL,
    ...Object.fromEntries(Object.keys(featureFlagsSchema.shape).map(name => [name, source[name]]))
  });
}
