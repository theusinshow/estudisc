import type { MetadataRoute } from "next";
import { siteUrl } from "@/features/public-site/site-url";

export const dynamic = "force-dynamic";


/**
 * Crawl everything except the API and admin (approved by the owner on 2026-10-18, docs/30-SEO.md). Indexing is
 * decided by noindex metadata, which crawlers can only honour on pages they may fetch; signed-in routes redirect
 * to the noindex sign-in page. Never block a bare prefix that also matches a public page ("/provas" would block
 * "/provas-anteriores").
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: `${base}/sitemap.xml`
  };
}
