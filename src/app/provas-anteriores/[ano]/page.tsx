import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { assessmentRepository } from "@/features/assessments/api";
import { PublicLayout } from "@/features/public-site/public-layout";
import { buildPublicPastExams, PAST_EXAM_COMMENTED_QUESTIONS } from "@/features/public-site/past-exams";
import { Breadcrumb, PastExamList, PastExamsCta } from "@/features/public-site/past-exams-view";
import { publicPageMetadata } from "@/features/public-site/seo";
import { siteUrl } from "@/features/public-site/site-url";
import { getServerEnv } from "@/lib/env";

type Props = Readonly<{ params: Promise<{ ano: string }> }>;
export const dynamic = "force-dynamic";

const yearOf = (value: string) => /^\d{4}$/.test(value) ? Number(value) : null;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const year = yearOf((await params).ano);
  // noindex until the owner releases real commented content (see /provas-anteriores).
  return publicPageMetadata({
    path: `/provas-anteriores/${year ?? ""}`,
    title: `Prova do IFSC integrado ${year ?? ""} com gabarito · Estudisc`,
    description: `Prova de ${year ?? ""} do Exame de Classificação dos cursos técnicos integrados do IFSC, com links para o caderno e o gabarito oficiais.`,
    indexable: false
  });
}

export default async function ProvasDoAnoPage({ params }: Props) {
  const year = yearOf((await params).ano);
  if (year === null) notFound();
  const [base, templates] = await Promise.all([siteUrl(), assessmentRepository().listTemplates()]);
  const exams = buildPublicPastExams(templates, new Date()).filter(exam => exam.year === year);
  if (exams.length === 0) notFound();
  const commented = PAST_EXAM_COMMENTED_QUESTIONS[year] ?? [];
  return (
    <PublicLayout labelledBy="provas-ano-title">
      <Breadcrumb base={base} trail={[{ name: "Estudisc", path: "/conheca" }, { name: "Provas anteriores", path: "/provas-anteriores" }, { name: String(year), path: `/provas-anteriores/${year}` }]} />
      <section className="public-hero">
        <p className="eyebrow">IFSC · Cursos técnicos integrados</p>
        <h1 id="provas-ano-title">Provas do IFSC integrado de {year}, com gabarito</h1>
        <p>Os cadernos e gabaritos são do IFSC; os links levam ao site oficial. O Estudisc é independente, sem vínculo com o IFSC.</p>
      </section>
      <section className="public-section" aria-labelledby="cadernos-title">
        <h2 id="cadernos-title">Cadernos e gabaritos oficiais</h2>
        <PastExamList exams={exams} />
      </section>
      {commented.length > 0 ? <section className="public-section" aria-labelledby="comentadas-title">
        <h2 id="comentadas-title">Questões comentadas</h2>
        <p>{commented.length} questões comentadas desta prova estão no Estudisc.</p>
      </section> : null}
      <PastExamsCta salesOpen={getServerEnv().FEATURE_PAID_ACCESS} />
    </PublicLayout>
  );
}
