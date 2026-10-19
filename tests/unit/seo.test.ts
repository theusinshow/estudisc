import type { Metadata } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pastExamSheetTemplateSchema } from "@/features/assessments/sheet-contracts";
import { courseJsonLd, faqJsonLd, organizationJsonLd, serializeJsonLd } from "@/features/public-site/json-ld";
import { buildPublicPastExams, pastExamYears } from "@/features/public-site/past-exams";
import { INDEXABLE_PAGES, publicPageMetadata } from "@/features/public-site/seo";
import { isPublicRuntimePath } from "@/features/auth/session-guard";
import { CTA_SOURCES, logCtaClick } from "@/lib/funnel-events";
import { sheetTemplateInput } from "./past-exam-fixture";

vi.mock("@/features/public-site/site-url", () => ({ siteUrl: async () => "https://www.estudisc.com.br" }));
// Page and layout modules load in plain Node here: stub the server-only marker and the font loader.
vi.mock("server-only", () => ({}));
vi.mock("next/font/google", () => ({ Archivo: () => ({ variable: "", className: "" }), JetBrains_Mono: () => ({ variable: "", className: "" }) }));
afterEach(() => { vi.restoreAllMocks(); });

const pageModules: Record<string, () => Promise<{ metadata?: Metadata }>> = {
  "/conheca": () => import("@/app/conheca/page"),
  "/pais-e-escolas": () => import("@/app/pais-e-escolas/page"),
  "/suporte": () => import("@/app/suporte/page"),
  "/termos": () => import("@/app/termos/page"),
  "/privacidade": () => import("@/app/privacidade/page")
};

describe("indexable public pages", () => {
  it.each(INDEXABLE_PAGES.map(page => page.path))("%s declares a self canonical and index", async path => {
    const { metadata } = await pageModules[path]!();
    expect(metadata?.alternates?.canonical).toBe(path);
    expect(metadata?.robots).toEqual({ index: true, follow: true });
  });

  it("uses the approved titles", async () => {
    expect((await pageModules["/conheca"]!()).metadata?.title).toBe("Exame de Classificação IFSC 2027/1 (técnico integrado) · Estudisc");
    expect((await pageModules["/pais-e-escolas"]!()).metadata?.title).toBe("Preparatório IFSC integrado para seu filho do 9º ano · Estudisc");
  });

  it("keeps everything else noindex by default and reads Search Console verification from the environment", async () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "");
    const { generateMetadata } = await import("@/app/layout");
    expect((await generateMetadata()).robots).toEqual({ index: false, follow: false });
    expect((await generateMetadata()).verification).toBeUndefined();
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "abc123");
    expect((await generateMetadata()).verification).toEqual({ google: "abc123" });
    vi.unstubAllEnvs();
  });

  it("builds the sitemap from indexable pages only, with lastmod", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    expect(entries.map(entry => entry.url)).toEqual(INDEXABLE_PAGES.map(page => `https://www.estudisc.com.br${page.path}`));
    expect(entries.every(entry => /^\d{4}-\d{2}-\d{2}$/.test(String(entry.lastModified)))).toBe(true);
    expect(entries.some(entry => entry.url.includes("/provas-anteriores"))).toBe(false);
  });

  it("marks pages waiting for content as noindex but followable", () => {
    expect(publicPageMetadata({ path: "/provas-anteriores", title: "x", indexable: false }).robots).toEqual({ index: false, follow: true });
  });
});

describe("structured data", () => {
  it("escapes '<' so content cannot close the script tag", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain("<");
  });

  it("describes the course with the real one-time price and no ratings", () => {
    const base = "https://www.estudisc.com.br";
    const course = courseJsonLd(base, "2026-11-29");
    expect(course).toMatchObject({ "@type": "Course", offers: { price: "39.90", priceCurrency: "BRL", availabilityEnds: "2026-11-29" }, provider: { "@id": `${base}/#organization` } });
    expect(JSON.stringify([course, organizationJsonLd(base)])).not.toMatch(/aggregateRating|review/i);
    expect(faqJsonLd([{ question: "Quanto custa?", answer: "R$ 50, pagamento único." }])).toMatchObject({ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Quanto custa?", acceptedAnswer: { text: "R$ 50, pagamento único." } }] });
  });
});

describe("public past exams", () => {
  const free = pastExamSheetTemplateSchema.parse(sheetTemplateInput());
  const reserved = pastExamSheetTemplateSchema.parse(sheetTemplateInput({ id: "past-exam-test-2026-1", title: "Prova 2026.1", availableAt: "2026-11-09T03:00:00.000Z", exam: { ...free.exam, examId: "ifsc-integrado-2026-1", edition: "2026.1", year: 2026 } }));
  const row = (definition: typeof free, id: string, version = definition.version) => ({ id, stableId: definition.id, version, kind: "PAST_EXAM_SHEET", definition: { ...definition, version } });

  it("lists only released editions, latest version, with official links and no answer keys", () => {
    const exams = buildPublicPastExams([row(free, "t1"), row(free, "t1b", free.version + 1), row(reserved, "t2"), { id: "x", stableId: "mini", version: 1, kind: "MINI_SIMULATION", definition: {} }], new Date("2026-10-18T12:00:00Z"));
    expect(exams).toHaveLength(1);
    expect(exams[0]).toMatchObject({ year: free.exam.year, examUrl: free.links.examUrl, answerKeyUrl: free.links.answerKeyUrl });
    expect(JSON.stringify(exams)).not.toContain("\"key\"");
    expect(pastExamYears(exams)).toEqual([free.exam.year]);
  });

  it("are reachable without sign-in, only for the index and four-digit years", () => {
    expect(isPublicRuntimePath("/provas-anteriores")).toBe(true);
    expect(isPublicRuntimePath("/provas-anteriores/2024")).toBe(true);
    expect(isPublicRuntimePath("/provas-anteriores/2024/x")).toBe(false);
    expect(isPublicRuntimePath("/provas")).toBe(false);
  });
});

describe("CTA click funnel event", () => {
  it("accepts only known sources", () => {
    expect(logCtaClick("landing_price")).toBe("landing_price");
    expect(logCtaClick("<script>")).toBeNull();
    expect(logCtaClick(undefined)).toBeNull();
    expect(CTA_SOURCES).toContain("past_exams");
  });
});
