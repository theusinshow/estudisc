import Link from "next/link";
import { ArrowRight } from "lucide-react";

import "@/styles/today.css";
import "@/styles/access-offer.css";
import { StudyActionCard } from "@/features/today/study-action-card";
import { formatTodayDate } from "@/features/today/today-date";
import { accessLastDay } from "@/features/public-site/content-summary";
import { FREE_SAMPLE_LESSONS, LIFETIME_PRICE_BRL } from "./contracts";

/** Subject code from a lesson id ("MAT-07" → "MAT"); colors the subject tab. */
const subjectOf = (lessonId: string) => lessonId.split("-")[0];

/**
 * Hoje for a signed-in student without full access (ADR 0061 free preview), laid out like the full
 * Hoje. It leads to what the account can actually open — one lesson per subject and the Diagnostic —
 * instead of adaptive sessions that would only answer "paid access required". The price stays one tap away.
 */
export function FreePreviewHome() {
  const [first, ...others] = FREE_SAMPLE_LESSONS;
  return (
    <div className="today today-evolution">
      <header className="today-header">
        <p className="today-date">{formatTodayDate()}</p>
        <h1>Hoje</h1>
      </header>
      <section className="today-next" aria-labelledby="free-start-title">
        <h2 id="free-start-title">Comece por aqui</h2>
        <StudyActionCard variant="lesson" title={first.title} reason={`${first.subject} · aula grátis. ${first.interactiveFeature}.`}
          href={`/lessons/${first.id}`} subjectCode={subjectOf(first.id)} />
      </section>
      <section className="today-queue" aria-labelledby="free-more-title">
        <h2 id="free-more-title">Ou escolha outra matéria</h2>
        <ol>{others.map(sample => <li key={sample.id}>
          <Link href={`/lessons/${sample.id}`} data-kind="continue" data-subject={subjectOf(sample.id)}>
            <span><strong>{sample.subject}</strong><small>Grátis: {sample.title}</small></span>
          </Link>
        </li>)}</ol>
      </section>
      <Link href="/assessments" className="offer-link">Fazer o simulado diagnóstico <span className="offer-link-end">grátis<ArrowRight aria-hidden="true" /></span></Link>
      <section className="offer-mini" aria-labelledby="free-full-title">
        <h2 id="free-full-title">Acesso completo</h2>
        <p><strong>R$&nbsp;{LIFETIME_PRICE_BRL}</strong> uma vez, com tudo liberado até {accessLastDay()}, o dia da prova.</p>
        <Link href="/upgrade" className="secondary-action">Ver acesso completo</Link>
      </section>
    </div>
  );
}
