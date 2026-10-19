import { LIFETIME_PRICE_AMOUNT } from "@/features/payments/contracts";

type JsonLdValue = Record<string, unknown>;

/** Structured data as a non-executable data block; "<" is escaped so content can never close the script tag. */
export function JsonLd({ data }: Readonly<{ data: JsonLdValue | JsonLdValue[] }>) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export function serializeJsonLd(data: JsonLdValue | JsonLdValue[]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationJsonLd(base: string): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "Estudisc",
    url: `${base}/conheca`,
    logo: `${base}/branding/estudisc-icon-512.png`
  };
}

/** Only facts the sales page states: what is included, the one-time price and the access end date. */
export function courseJsonLd(base: string, accessEndsOn: string): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Preparação para o Exame de Classificação do IFSC 2027/1 (técnico integrado)",
    description: "Aulas, questões comentadas, simulados e provas anteriores para o Exame de Classificação dos cursos técnicos integrados do IFSC 2027/1.",
    inLanguage: "pt-BR",
    url: `${base}/conheca`,
    provider: { "@id": `${base}/#organization` },
    offers: {
      "@type": "Offer",
      category: "Paid",
      price: LIFETIME_PRICE_AMOUNT.toFixed(2),
      priceCurrency: "BRL",
      availabilityEnds: accessEndsOn,
      url: `${base}/conheca#preco`
    },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "Autoestudo no celular", endDate: accessEndsOn }
  };
}

export type FaqItem = Readonly<{ question: string; answer: string }>;

export function faqJsonLd(items: readonly FaqItem[]): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } }))
  };
}

export function breadcrumbJsonLd(base: string, trail: readonly Readonly<{ name: string; path: string }>[]): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `${base}${item.path}` }))
  };
}
