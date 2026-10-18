import Link from "next/link";
import { breadcrumbJsonLd, JsonLd } from "./json-ld";
import type { PublicPastExam } from "./past-exams";

export type Crumb = Readonly<{ name: string; path: string }>;

/** Visible breadcrumb plus BreadcrumbList data from the same trail. */
export function Breadcrumb({ base, trail }: Readonly<{ base: string; trail: readonly Crumb[] }>) {
  return <>
    <nav className="public-breadcrumb" aria-label="Você está em">
      <ol>{trail.map((crumb, index) => <li key={crumb.path}>{index === trail.length - 1 ? <span aria-current="page">{crumb.name}</span> : <Link href={crumb.path}>{crumb.name}</Link>}</li>)}</ol>
    </nav>
    <JsonLd data={breadcrumbJsonLd(base, trail)} />
  </>;
}

const dateOnly = (value: string) => value.split("-").reverse().join("/");

export function PastExamList({ exams }: Readonly<{ exams: readonly PublicPastExam[] }>) {
  return <ul className="public-list past-exam-public-list">
    {exams.map(exam => <li key={exam.stableId}>
      <strong>{exam.title}</strong> · aplicada em {dateOnly(exam.appliedOn)} · {exam.itemCount} questões
      <span className="past-exam-public-links">
        <a href={exam.examUrl} rel="noopener" target="_blank">Caderno oficial (PDF)</a>
        <a href={exam.answerKeyUrl} rel="noopener" target="_blank">Gabarito oficial</a>
      </span>
    </li>)}
  </ul>;
}

export function PastExamsCta({ salesOpen }: Readonly<{ salesOpen: boolean }>) {
  return <section className="public-section public-price" aria-labelledby="provas-cta-title">
    <h2 id="provas-cta-title">Resolva com cartão-resposta e correção</h2>
    <p>No Estudisc, você abre o caderno oficial, marca as respostas no cartão com o tempo da prova e vê a correção pelo gabarito oficial quando finalizar.</p>
    {salesOpen
      ? <Link href="/auth/signin?callbackUrl=%2Fupgrade&origem=past_exams" className="primary-action">Criar conta e assinar</Link>
      : <Link href="/conheca" className="primary-action">Ver como funciona</Link>}
  </section>;
}
