import { getServerEnv } from "@/lib/env";

/** Public origin for absolute links in the sitemap, robots and link previews. */
export function siteUrl(env = getServerEnv()) {
  return (env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
