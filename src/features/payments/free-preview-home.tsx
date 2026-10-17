import Link from "next/link";

import { CONTENT_SUMMARY, formatCount } from "@/features/public-site/content-summary";
import { FREE_SAMPLE_LESSONS, LIFETIME_PRICE_BRL } from "./contracts";

/**
 * Home for a signed-in student without full access (ADR 0061 free preview). It leads to what the
 * account can actually open — the Diagnostic and one lesson per subject — instead of adaptive
 * sessions that would only answer "paid access required". The price stays one click away.
 */
export function FreePreviewHome() {
  return (
    <section className="foundation-panel content-panel accent-panel accent-learn" aria-labelledby="free-home-title">
      <p className="eyebrow">Comece por aqui · grátis</p>
      <h1 id="free-home-title">Conheça o Estudisc antes de decidir</h1>
      <p>Sua conta já abre o simulado diagnóstico e uma aula completa de cada matéria. Não precisa pagar nada para começar.</p>

      <div className="learning-controls">
        <Link href="/assessments" className="primary-action">
          Fazer o simulado diagnóstico
        </Link>
        <Link href={`/lessons/${FREE_SAMPLE_LESSONS[0].id}`} className="secondary-action">
          Começar por uma aula
        </Link>
      </div>

      <section className="module-section" aria-labelledby="free-home-lessons">
        <h2 id="free-home-lessons">Aulas liberadas na sua conta</h2>
        <ul className="concept-list">
          {FREE_SAMPLE_LESSONS.map((sample) => (
            <li key={sample.id}>
              <Link href={`/lessons/${sample.id}`}>
                <strong>
                  {sample.subject} · {sample.title}
                </strong>
                <span>{sample.interactiveFeature}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="module-section" aria-labelledby="free-home-full">
        <h2 id="free-home-full">Quando quiser o curso inteiro</h2>
        <p>
          {formatCount(CONTENT_SUMMARY.lessons)} aulas, {formatCount(CONTENT_SUMMARY.lessonQuestions)} questões, simulados e plano de estudos
          adaptativo. Pagamento único de R$ {LIFETIME_PRICE_BRL},00 por Pix ou cartão, com acesso até o dia da prova (29/11/2026).
        </p>
        <Link href="/upgrade" className="secondary-action">
          Ver acesso completo
        </Link>
      </section>
    </section>
  );
}
