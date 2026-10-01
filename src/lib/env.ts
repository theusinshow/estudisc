import { z } from "zod";

const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.url().optional());
const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional()
);
const optionalUrlWithDefault = (defaultValue: string) =>
  z.preprocess((value) => (value === "" ? undefined : value), z.url().default(defaultValue));
const optionalBooleanString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["true", "false"]).optional()
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
  KNOW_OS_ALLOWED_GOOGLE_EMAILS: emailAllowlist,
  KNOW_OS_ADMIN_GOOGLE_EMAILS: emailAllowlist,
  KNOW_OS_OWNER_ID: z.string().trim().min(1).default("local-owner"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
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
    KNOW_OS_ALLOWED_GOOGLE_EMAILS: source.KNOW_OS_ALLOWED_GOOGLE_EMAILS,
    KNOW_OS_ADMIN_GOOGLE_EMAILS: source.KNOW_OS_ADMIN_GOOGLE_EMAILS,
    KNOW_OS_OWNER_ID: source.KNOW_OS_OWNER_ID,
    LOG_LEVEL: source.LOG_LEVEL
  });
}
