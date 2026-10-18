# SEO — public pages, indexing and crawling

Last updated: 2026-10-18 (SEO pass, branch `feat/seo-20261018`).

## Main URL

The product's main URL is **`/conheca`**. `/` cannot be the public home: for a signed-in student it is the study app (Hoje). A visitor without a session who opens `/` gets a **307** to `/conheca` from the proxy.

`/` is not a 301/308 on purpose. Browsers cache permanent redirects, so a student who once opened `/` signed out would keep being sent to the sales page after signing in. The canonical on `/conheca` and the sitemap tell Google which URL to show; robots.txt allows `/`, so the crawler can follow the redirect.

## How indexing is decided

- `src/features/public-site/seo.ts` → `INDEXABLE_PAGES` is the single list of indexable pages. The sitemap is generated from it (with `lastModified`); update the date when a page's content changes.
- Each of those pages builds its metadata with `publicPageMetadata({ path, title, description })`, which adds a self-referencing canonical and `robots: index, follow`. A unit test fails if a listed page lacks either.
- The root layout sets `robots: noindex, nofollow` for every other page (app, admin, sign-in, sign-up). `next.config.ts` adds `X-Robots-Tag: noindex, nofollow` to `/api/*`.
- Structured data: `src/features/public-site/json-ld.tsx` (Organization, Course, FAQPage, BreadcrumbList). Use only facts the page shows; never ratings or reviews.

## Route classification

| Route | Access | Indexing |
|---|---|---|
| `/conheca`, `/pais-e-escolas`, `/suporte`, `/termos`, `/privacidade` | public | **index** + canonical, in the sitemap |
| `/provas-anteriores`, `/provas-anteriores/[ano]` | public | **noindex, follow** until the content is released; not in the sitemap |
| `/` | visitors → 307 `/conheca`; signed-in → app | not indexed (redirect) |
| `/auth/signin`, `/auth/cadastro` | public | noindex |
| `/robots.txt`, `/sitemap.xml`, `/opengraph-image` | public | files |
| `/achievements`, `/assessments`, `/assessments/[id]`, `/concepts/[id]`, `/conta`, `/exports`, `/history`, `/import`, `/knowledge-map`, `/lessons/[id]`, `/mistakes`, `/past-exams`, `/plan`, `/progress`, `/projects`, `/provas`, `/review`, `/study/[id]`, `/tracks`, `/tracks/[id]`, `/upgrade`, `/voce`, `/continuar` | sign-in | noindex |
| `/admin`, `/admin/content-studio`, `/admin/lab`, `/admin/review`, `/admin/review/[lessonId]`, `/admin/users` | ADMIN | noindex |
| `/api/*` | mixed | `X-Robots-Tag: noindex` |

## robots.txt

Approved by the owner on 2026-10-18 (replaces the former `Disallow: /` allowlist): allow by default and block only areas that are never useful to crawl.

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Sitemap: https://www.estudisc.com.br/sitemap.xml
```

Signed-in routes stay crawlable on purpose: for a crawler they redirect to the sign-in page, which is noindex, and Google can only honour a noindex it is allowed to fetch. Any explicit block must not use a bare prefix that also matches public pages (`Disallow: /provas` would also block `/provas-anteriores`; use `/provas$` and `/provas/`).

## Releasing /provas-anteriores

1. Fill `PAST_EXAM_COMMENTED_QUESTIONS` in `src/features/public-site/past-exams.ts` with 3–5 published Question ids per year (only Questions that already exist in the product) and render them in `src/app/provas-anteriores/[ano]/page.tsx`.
2. Remove `indexable: false` from both `/provas-anteriores` pages.
3. Add `/provas-anteriores` to `INDEXABLE_PAGES`, and extend `src/app/sitemap.ts` with one entry per released year.
4. robots.txt already allows `/provas-anteriores`.

## Measurement

- Search Console: the domain is verified by DNS TXT. `GOOGLE_SITE_VERIFICATION` (empty by default) adds the HTML meta tag if a URL-prefix property is ever needed.
- Subscribe buttons link to sign-in with `origem=<source>`; the sign-in page logs the `cta_clicked` funnel step for known sources only (`CTA_SOURCES` in `src/lib/funnel-events.ts`). No third-party tracker. See `docs/29-CONVERSION-FUNNEL.md`.
