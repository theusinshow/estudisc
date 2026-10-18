import type { Metadata } from "next";
import Link from "next/link";
import { assessmentRepository } from "@/features/assessments/api";
import { PublicLayout } from "@/features/public-site/public-layout";
import { buildPublicPastExams, pastExamYears } from "@/features/public-site/past-exams";
import { Breadcrumb, PastExamList, PastExamsCta } from "@/features/public-site/past-exams-view";
import { publicPageMetadata } from "@/features/public-site/seo";
import { siteUrl } from "@/features/public-site/site-url";
import { getServerEnv } from "@/lib/env";

// noindex until the owner releases real commented content; then drop `indexable: false` and add the page to INDEXABLE_PAGES.
export const metadata: Metadata = publicPageMetadata({
  path: "/provas-anteriores",
  title: "Provas anteriores do IFSC integrado com gabarito · Estudisc",
  description: "Provas anteriores do Exame de Classificação dos cursos técnicos integrados do IFSC, com links para o caderno e o gabarito oficiais.",
  indexable: false
});
export const dynamic = "force-dynamic";

export default async function ProvasAnterioresPage() {
  const [base, templates] = await Promise.all([siteUrl(), assessmentRepository().listTemplates()]);
  const exams = buildPublicPastExams(templates, new Date());
  return (
    <PublicLayout labelledBy="provas-title">
      <Breadcrumb base={base} trail={[{ name: "Estudisc", path: "/conheca" }, { name: "Provas anteriores", path: "/provas-anteriores" }]} />
      <section className="public-hero">
        <p className="eyebrow">IFSC · Cursos técnicos integrados</p>
        <h1 id="provas-title">Provas anteriores do IFSC integrado, com gabarito e comentários</h1>
        <p>Os cadernos e gabaritos são do IFSC; os links levam ao site oficial. O Estudisc é independente, sem vínculo com o IFSC.</p>
      </section>
      {pastExamYears(exams).map(year => <section key={year} className="public-section" aria-labelledby={`ano-${year}`}>
        <h2 id={`ano-${year}`}><Link href={`/provas-anteriores/${year}`}>Provas de {year}</Link></h2>
        <PastExamList exams={exams.filter(exam => exam.year === year)} />
      </section>)}
      {exams.length === 0 ? <p className="public-note">A lista de provas anteriores será publicada em breve.</p> : null}
      <PastExamsCta salesOpen={getServerEnv().FEATURE_PAID_ACCESS} />
    </PublicLayout>
  );
}
