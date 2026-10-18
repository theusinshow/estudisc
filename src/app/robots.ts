import type { MetadataRoute } from "next";
import { siteUrl } from "@/features/public-site/site-url";

export const dynamic = "force-dynamic";

const ROBOTS_ALLOW = ["/$", "/conheca", "/termos", "/privacidade", "/suporte", "/pais-e-escolas"];

/** Only the public sales, support and legal pages are meant for search engines; the study app requires sign-in.
 *  "/$" lets crawlers follow the home redirect to /conheca without opening any app route. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl();
  return {
    // Frozen on purpose (SEO pass 2026-10-18): changing these rules waits for the owner's approval of the route list.
    rules: { userAgent: "*", allow: ROBOTS_ALLOW, disallow: ["/"] },
    sitemap: `${base}/sitemap.xml`
  };
}
