import type { MetadataRoute } from "next";
import { PUBLIC_SITE_PATHS } from "@/features/auth/session-guard";
import { siteUrl } from "@/features/public-site/site-url";

export const dynamic = "force-dynamic";

/** Only the public sales, support and legal pages are meant for search engines; the study app requires sign-in. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: "*", allow: [...PUBLIC_SITE_PATHS], disallow: ["/"] },
    sitemap: `${base}/sitemap.xml`
  };
}
