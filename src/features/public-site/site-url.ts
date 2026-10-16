import { getServerEnv } from "@/lib/env";

/**
 * Public origin for absolute links in the sitemap, robots and link previews. Uses APP_URL when configured;
 * otherwise the host of the current request (as forwarded by the hosting proxy), so previews never point to localhost.
 */
export async function siteUrl(env = getServerEnv()) {
  if (env.APP_URL) return env.APP_URL.replace(/\/+$/, "");
  const { headers } = await import("next/headers");
  const request = await headers();
  const host = request.get("x-forwarded-host") ?? request.get("host");
  if (!host || !/^[A-Za-z0-9.-]+(:\d+)?$/.test(host)) return "http://localhost:3000";
  const protocol = request.get("x-forwarded-proto") === "http" ? "http" : "https";
  return `${protocol}://${host}`;
}
