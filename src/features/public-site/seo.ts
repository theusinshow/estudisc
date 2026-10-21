import type { Metadata } from "next";

/**
 * Public pages that search engines may index (SEO pass, 2026-10-18). The sitemap is generated from this list,
 * and every page here declares a self-referencing canonical and `index` through `publicPageMetadata`.
 * Everything else inherits `noindex` from the root layout. Update `lastModified` when a page's content changes.
 */
export const INDEXABLE_PAGES = [
  { path: "/conheca", lastModified: "2026-10-21", priority: 1 },
  { path: "/pais-e-escolas", lastModified: "2026-10-18", priority: 0.8 },
  { path: "/suporte", lastModified: "2026-10-17", priority: 0.5 },
  { path: "/termos", lastModified: "2026-10-17", priority: 0.3 },
  { path: "/privacidade", lastModified: "2026-10-17", priority: 0.3 }
] as const;

/** The product's main URL. Signed-out "/" 301s here; for signed-in students "/" is the study app. */
export const MAIN_PUBLIC_PATH = "/conheca";

export const NOINDEX_ROBOTS: NonNullable<Metadata["robots"]> = { index: false, follow: false };

/** Title, description, self-referencing canonical and robots for a public page. */
export function publicPageMetadata(input: Readonly<{ path: string; title: string; description?: string; indexable?: boolean }>): Metadata {
  return {
    title: input.title,
    ...(input.description ? { description: input.description } : {}),
    alternates: { canonical: input.path },
    // Pages waiting for real content stay out of the index but let crawlers follow their links.
    robots: input.indexable === false ? { index: false, follow: true } : { index: true, follow: true }
  };
}
