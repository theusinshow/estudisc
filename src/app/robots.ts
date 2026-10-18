import type { MetadataRoute } from "next";
import { PUBLIC_SITE_PATHS } from "@/features/auth/session-guard";
import { siteUrl } from "@/features/public-site/site-url";

export const dynamic = "force-dynamic";

/** Only the public sales, support and legal pages are meant for search engines; the study app requires sign-in.
 *  "/$" lets crawlers follow the home redirect to /conheca without opening any app route. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl();
  return {
    rules: { userAgent: "*", allow: ["/$", ...PUBLIC_SITE_PATHS], disallow: ["/"] },
    sitemap: `${base}/sitemap.xml`
  };
}
