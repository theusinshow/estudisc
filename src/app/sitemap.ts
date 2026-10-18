import type { MetadataRoute } from "next";
import { INDEXABLE_PAGES } from "@/features/public-site/seo";
import { siteUrl } from "@/features/public-site/site-url";

export const dynamic = "force-dynamic";

/** Only indexable public pages (noindex pages such as /provas-anteriores stay out until they are opened). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  return INDEXABLE_PAGES.map(page => ({ url: `${base}${page.path}`, lastModified: page.lastModified, changeFrequency: "weekly", priority: page.priority }));
}
