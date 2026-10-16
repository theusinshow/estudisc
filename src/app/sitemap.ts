import type { MetadataRoute } from "next";
import { PUBLIC_SITE_PATHS } from "@/features/auth/session-guard";
import { siteUrl } from "@/features/public-site/site-url";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PUBLIC_SITE_PATHS.map(path => ({ url: `${base}${path}`, changeFrequency: "weekly", priority: path === "/conheca" ? 1 : 0.5 }));
}
